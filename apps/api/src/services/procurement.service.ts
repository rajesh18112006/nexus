import { PurchaseOrder } from '../models/PurchaseOrder';
import { GoodsReceipt } from '../models/GoodsReceipt';
import { StockLevel } from '../models/StockLevel';
import { StockLedger } from '../models/StockLedger';
import { CreatePOInput, CreateGRNInput, POQuery, POStatus } from '@nexus/shared';

export const ProcurementService = {
  async listPOs(organizationId: string, query: POQuery) {
    const filter: any = { organizationId };
    if (query.search) {
      filter.$or = [
        { poNumber: { $regex: query.search, $options: 'i' } },
        { supplierName: { $regex: query.search, $options: 'i' } },
        { warehouseName: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.supplierId) {
      filter.supplierId = query.supplierId;
    }
    if (query.warehouseId) {
      filter.warehouseId = query.warehouseId;
    }

    const skip = (query.page - 1) * query.limit;
    const [purchaseOrders, total] = await Promise.all([
      PurchaseOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      PurchaseOrder.countDocuments(filter),
    ]);

    return {
      purchaseOrders,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getPOById(organizationId: string, id: string) {
    const po = await PurchaseOrder.findOne({ _id: id, organizationId });
    if (!po) {
      throw new Error('Purchase Order not found');
    }
    return po;
  },

  async createPO(organizationId: string, userId: string, userName: string, input: CreatePOInput) {
    const count = await PurchaseOrder.countDocuments({ organizationId });
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1001).padStart(4, '0')}`;

    let subtotal = 0;
    let taxAmount = 0;

    const items = input.items.map((item) => {
      const lineSubtotal = item.quantityOrdered * item.unitPrice;
      const lineTax = (lineSubtotal * (item.gstRate || 18)) / 100;
      subtotal += lineSubtotal;
      taxAmount += lineTax;
      return {
        ...item,
        totalPrice: lineSubtotal + lineTax,
      };
    });

    const totalAmount = subtotal + taxAmount;

    return PurchaseOrder.create({
      organizationId,
      poNumber,
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      warehouseId: input.warehouseId,
      warehouseName: input.warehouseName,
      expectedDeliveryDate: new Date(input.expectedDeliveryDate),
      items,
      subtotal,
      taxAmount,
      totalAmount,
      notes: input.notes,
      createdByUserId: userId,
      createdByName: userName,
      status: 'DRAFT',
    });
  },

  async updatePOStatus(
    organizationId: string,
    id: string,
    userId: string,
    userName: string,
    status: POStatus,
    notes?: string
  ) {
    const po = await PurchaseOrder.findOne({ _id: id, organizationId });
    if (!po) {
      throw new Error('Purchase Order not found');
    }

    po.status = status as any;
    if (notes) po.notes = notes;

    const s = String(status).toLowerCase();
    if (s === 'approved') {
      po.approvedByUserId = userId as any;
      po.approvedByName = userName;
      po.approvedAt = new Date();
    } else if (s === 'pending_approval' || s === 'submitted') {
      po.submittedAt = new Date();
    }

    await po.save();
    return po;
  },

  async createGRN(organizationId: string, userId: string, userName: string, input: CreateGRNInput) {
    const po = await PurchaseOrder.findOne({ _id: input.purchaseOrderId, organizationId });
    if (!po) {
      throw new Error('Purchase Order not found');
    }

    const grnCount = await GoodsReceipt.countDocuments({ organizationId });
    const grnNumber = `GRN-${new Date().getFullYear()}-${String(grnCount + 1001).padStart(4, '0')}`;

    const grn = await GoodsReceipt.create({
      organizationId,
      grnNumber,
      purchaseOrderId: po._id,
      warehouseId: input.warehouseId,
      invoiceNumber: input.invoiceNumber,
      invoiceAmount: input.invoiceAmount,
      items: input.items,
      receivedByUserId: userId,
      receivedByName: userName,
      notes: input.notes,
    });

    // Update PO item quantityReceived and PO status
    let allReceived = true;
    let anyReceived = false;

    for (const grnItem of input.items) {
      const poItem = po.items.find((item) => item.productId.toString() === grnItem.productId);
      if (poItem) {
        poItem.quantityReceived += grnItem.quantityAccepted;
        if (poItem.quantityReceived >= poItem.quantityOrdered) {
          anyReceived = true;
        } else {
          allReceived = false;
          if (poItem.quantityReceived > 0) anyReceived = true;
        }

        // Increment inventory in StockLevel
        let stockLevel = await StockLevel.findOne({
          organizationId,
          productId: grnItem.productId,
          warehouseId: input.warehouseId,
        });

        const prevQty = stockLevel ? stockLevel.quantityOnHand : 0;
        const newQty = prevQty + grnItem.quantityAccepted;

        if (stockLevel) {
          stockLevel.quantityOnHand = newQty;
          stockLevel.quantityOnOrder = Math.max(0, stockLevel.quantityOnOrder - grnItem.quantityAccepted);
          stockLevel.lastMovementAt = new Date();
          await stockLevel.save();
        } else {
          await StockLevel.create({
            organizationId,
            productId: grnItem.productId,
            warehouseId: input.warehouseId,
            binLocation: 'RECEIVING-DOCK',
            quantityOnHand: grnItem.quantityAccepted,
            quantityAllocated: 0,
            quantityOnOrder: 0,
            safetyStock: 10,
            reorderPoint: 20,
            lastMovementAt: new Date(),
          });
        }

        // Record StockLedger entry
        await StockLedger.create({
          organizationId,
          productId: grnItem.productId,
          warehouseId: input.warehouseId,
          movementType: 'receipt',
          quantityDelta: grnItem.quantityAccepted,
          previousQuantityOnHand: prevQty,
          newQuantityOnHand: newQty,
          unitCost: poItem.unitPrice,
          totalValue: grnItem.quantityAccepted * poItem.unitPrice,
          referenceType: 'PO_RECEIPT',
          referenceId: grn.grnNumber,
          performedByUserId: userId,
          performedByName: userName,
          notes: `Goods Received against ${po.poNumber}`,
        });
      }
    }

    if (allReceived) {
      po.status = 'RECEIVED';
    } else if (anyReceived) {
      po.status = 'PARTIALLY_RECEIVED';
    }

    await po.save();
    return { grn, po };
  },

  async getGRNsForPO(organizationId: string, purchaseOrderId: string) {
    return GoodsReceipt.find({ organizationId, purchaseOrderId }).sort({ createdAt: -1 });
  },
};
