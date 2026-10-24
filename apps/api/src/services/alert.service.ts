import { Alert } from '../models/Alert';
import { Product } from '../models/Product';
import { PurchaseOrder } from '../models/PurchaseOrder';

export const AlertService = {
  async listAlerts(organizationId: string, isResolved = false) {
    return Alert.find({ organizationId, isResolved }).sort({ createdAt: -1 });
  },

  async resolveAlert(organizationId: string, alertId: string, userId: string) {
    const alert = await Alert.findOneAndUpdate(
      { _id: alertId, organizationId },
      { isResolved: true, resolvedAt: new Date(), resolvedByUserId: userId as any },
      { new: true }
    );
    if (!alert) {
      throw new Error('Alert not found');
    }
    return alert;
  },

  async getMorningBrief(organizationId: string) {
    const activeAlerts = await Alert.find({ organizationId, isResolved: false });
    const criticalAlerts = activeAlerts.filter((a) => a.severity === 'CRITICAL');
    const warningAlerts = activeAlerts.filter((a) => a.severity === 'WARNING');

    const openPOs = await PurchaseOrder.find({
      organizationId,
      status: { $in: ['DRAFT', 'SUBMITTED', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED'] },
    });

    return {
      date: new Date().toISOString(),
      headline: criticalAlerts.length > 0
        ? `Attention Required: ${criticalAlerts.length} critical inventory stockout risk(s) identified.`
        : 'Operations standard: All warehouse inventory metrics within expected safety threshold.',
      metrics: {
        criticalCount: criticalAlerts.length,
        warningCount: warningAlerts.length,
        openPOCount: openPOs.length,
        pendingApprovalCount: openPOs.filter((p) => p.status === 'SUBMITTED').length,
      },
      topAlerts: activeAlerts.slice(0, 5),
    };
  },
};
