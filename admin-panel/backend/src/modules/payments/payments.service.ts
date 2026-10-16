import { repository } from '../../db/repository';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError';

export class PaymentsService {
  async getPayments(collegeId?: string) {
    return await repository.getAllPayments(collegeId);
  }

  async recordPayment(paymentData: any, actor: { userId: string; name: string; role: string; ip: string }) {
    const existing = await repository.getAllPayments();
    const duplicate = existing.find(
      (p) => p.invoiceNumber.toLowerCase() === paymentData.invoiceNumber.trim().toLowerCase()
    );
    if (duplicate) {
      throw new ConflictError(`Invoice number '${paymentData.invoiceNumber}' is already recorded.`);
    }

    const college = await repository.getCollegeById(paymentData.collegeId);
    if (!college) {
      throw new NotFoundError(`College '${paymentData.collegeId}' not found.`);
    }

    const created = await repository.createPayment({
      ...paymentData,
      collegeName: college.name,
    });

    await repository.createAuditLog({
      actorStaffId: actor.userId,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'RECORD_PAYMENT',
      entity: 'PaymentInvoice',
      entityId: created.id,
      entityName: created.invoiceNumber,
      ip: actor.ip,
      result: 'Success',
      reason: `Recorded institutional invoice payment of ₹${created.amount} for ${college.name}`,
    });

    return created;
  }
}

export const paymentsService = new PaymentsService();
