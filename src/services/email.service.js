import nodemailer from 'nodemailer';
export class EmailService {
    constructor(config) {
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: config.auth
        });
    }
    async sendOrderConfirmation(to, orderInfo) {
        try {
            const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🎉 Đơn hàng đã được đặt thành công!</h2>
          <p>Xin chào <strong>${orderInfo.customerName}</strong>,</p>
          <p>Cảm ơn bạn đã đặt hàng. Dưới đây là chi tiết đơn hàng:</p>
          
          <h3>🛍️ Đơn hàng #${orderInfo.orderNumber}</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                <th style="padding: 10px; text-align: center;">Số lượng</th>
                <th style="padding: 10px; text-align: right;">Giá</th>
                <th style="padding: 10px; text-align: right;">Tổng</th>
              </tr>
            </thead>
            <tbody>
              ${orderInfo.items.map(item => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
                  <td style="padding: 10px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${new Intl.NumberFormat('vi-VN').format(item.price)}₫</td>
                  <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${new Intl.NumberFormat('vi-VN').format(item.price * item.quantity)}₫</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="text-align: right; font-size: 18px; font-weight: bold; margin: 20px 0;">
            Tổng cộng: ${new Intl.NumberFormat('vi-VN').format(orderInfo.total)}₫
          </div>
          
          <h3>📍 Địa chỉ giao hàng:</h3>
          <p>${orderInfo.shippingAddress.replace(/,/g, '<br>')}</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            © 2026 Fashion Shop. All rights reserved.<br>
            Email này được tự động gửi, vui lòng không trả lời.
          </p>
        </div>
      `;
            await this.transporter.sendMail({
                from: `"Fashion Shop" <${config.auth.user}>`,
                to: to,
                subject: `[Fashion Shop] Xác nhận đơn hàng #${orderInfo.orderNumber}`,
                html
            });
            return true;
        }
        catch (error) {
            console.error('Send email error:', error);
            return false;
        }
    }
    async sendOrderStatusUpdate(to, orderInfo) {
        try {
            const statusMessages = {
                pending: 'Chờ xác nhận',
                processing: 'Đang xử lý',
                shipped: 'Đã gửi hàng',
                delivered: 'Đã giao hàng',
                cancelled: 'Đã hủy'
            };
            const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">📦 Cập nhật trạng thái đơn hàng</h2>
          <p>Xin chào <strong>${orderInfo.customerName}</strong>,</p>
          <p>Đơn hàng <strong>#${orderInfo.orderNumber}</strong> của bạn đã được cập nhật trạng thái:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Trạng thái cũ:</strong> ${statusMessages[orderInfo.oldStatus] || orderInfo.oldStatus}</p>
            <p style="margin: 0;"><strong>Trạng thái mới:</strong> ${statusMessages[orderInfo.newStatus] || orderInfo.newStatus}</p>
          </div>
          
          <p>Bạn có thể theo dõi đơn hàng tại: <a href="http://localhost:3002/orders">http://localhost:3002/orders</a></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            © 2026 Fashion Shop. All rights reserved.
          </p>
        </div>
      `;
            await this.transporter.sendMail({
                from: `"Fashion Shop" <${config.auth.user}>`,
                to: to,
                subject: `[Fashion Shop] Cập nhật đơn hàng #${orderInfo.orderNumber}`,
                html
            });
            return true;
        }
        catch (error) {
            console.error('Send email error:', error);
            return false;
        }
    }
}
export function createEmailService() {
    const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || ''
        }
    };
    return new EmailService(config);
}
