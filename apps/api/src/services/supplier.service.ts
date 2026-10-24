import { Supplier } from '../models/Supplier';
import { CreateSupplierInput, UpdateSupplierInput, SupplierQuery } from '@nexus/shared';

export const SupplierService = {
  async list(organizationId: string, query: SupplierQuery) {
    const filter: any = { organizationId };
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { code: { $regex: query.search, $options: 'i' } },
        { contactName: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.status) {
      filter.status = query.status;
    }

    const skip = (query.page - 1) * query.limit;
    const [suppliers, total] = await Promise.all([
      Supplier.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      Supplier.countDocuments(filter),
    ]);

    return {
      suppliers,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getById(organizationId: string, id: string) {
    const supplier = await Supplier.findOne({ _id: id, organizationId });
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    return supplier;
  },

  async create(organizationId: string, input: CreateSupplierInput) {
    const existing = await Supplier.findOne({ organizationId, code: input.code.toUpperCase() });
    if (existing) {
      throw new Error(`Supplier with code ${input.code} already exists`);
    }
    return Supplier.create({
      ...input,
      organizationId,
      code: input.code.toUpperCase(),
    });
  },

  async update(organizationId: string, id: string, input: UpdateSupplierInput) {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: input },
      { new: true, runValidators: true }
    );
    if (!supplier) {
      throw new Error('Supplier not found');
    }
    return supplier;
  },
};
