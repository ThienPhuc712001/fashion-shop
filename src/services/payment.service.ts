import crypto from 'crypto';

export interface PaymentConfig {
  momo: {
    merchantId: string;
    accessKey: string;
    secretKey: string;
    redirectUrl: string;
    notifyUrl: string;
  };
  vnpay: {
    tmnCode: string;
    hashSecret: string;
    redirectUrl: string;
    notifyUrl: string;
  };
}

export class MomoPaymentService {
  private config: PaymentConfig['momo'];

  constructor(config: PaymentConfig['momo']) {
    this.config = config;
  }

  createPayment(orderId: string, amount: number, orderInfo: string): { paymentUrl: string; data: any } {
    const { merchantId, accessKey, secretKey, redirectUrl, notifyUrl } = this.config;

    const partnerCode = merchantId;
    const redirectUrlEncoded = encodeURIComponent(redirectUrl);
    const notifyUrlEncoded = encodeURIComponent(notifyUrl);
    const requestId = partnerCode + new Date().getTime();
    const amountStr = Math.round(amount).toString();
    const orderIdStr = orderId;
    const orderInfoStr = orderInfo;
    const extraData = '';

    const rawSignature = `accessKey=${accessKey}&amount=${amountStr}&extraData=${extraData}&merchantId=${partnerCode}&orderId=${orderIdStr}&orderInfo=${orderInfoStr}&partnerCode=${partnerCode}&redirectUrl=${redirectUrlEncoded}&requestId=${requestId}&requestType=payment&version=2.0`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const paymentUrl = `https://payment.momo.vn/v2/gateway/api/create?partnerCode=${partnerCode}&accessKey=${accessKey}&requestId=${requestId}&amount=${amountStr}&orderId=${orderIdStr}&orderInfo=${encodeURIComponent(orderInfoStr)}&redirectUrl=${redirectUrlEncoded}&notifyUrl=${notifyUrlEncoded}&extraData=${extraData}&requestType=payment&signature=${signature}`;

    return {
      paymentUrl,
      data: { requestId, signature, amount: amountStr }
    };
  }

  verifyCallback(params: any): boolean {
    const { accessKey, partnerCode, orderId, requestId, amount, orderInfo, orderType, transId, resultCode, message, payType, additionalData, signature } = params;

    const raw = `accessKey=${accessKey}&extraData=${additionalData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${params.responseTime || ''}&resultCode=${resultCode}&transId=${transId}`;
    const expected = crypto.createHmac('sha256', this.config.secretKey).update(raw).digest('hex');
    return expected === signature;
  }
}

export class VNPayPaymentService {
  private config: PaymentConfig['vnpay'];

  constructor(config: PaymentConfig['vnpay']) {
    this.config = config;
  }

  createPayment(orderId: string, amount: number, orderInfo: string): { paymentUrl: string; data: any } {
    const { tmnCode, hashSecret, redirectUrl, notifyUrl } = this.config;

    const vnp_Version = '2.1.0';
    const vnp_TxnRef = orderId;
    const vnp_Command = 'pay';
    const vnp_OrderInfo = orderInfo;
    const vnp_Amount = Math.round(amount * 100).toString(); // VNPay dùng x100
    const vnp_OrderType = 'other';
    const vnp_Locale = 'vn';
    const vnp_Return = redirectUrl;
    const vnp_IpAddr = '127.0.0.1'; // TODO: get real IP
    const vnp_CreateDate = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const vnp_CurrCode = 'VND';

    const date = new Date();
    const vnp_ExpireDate = new Date(date.getTime() + 15 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const data: any = {
      vnp_Version,
      vnp_TmnCode: tmnCode,
      vnp_Command,
      vnp_TxnRef: vnp_TxnRef,
      vnp_Amount: vnp_Amount,
      vnp_OrderInfo: Buffer.from(vnp_OrderInfo, 'utf8').toString('base64'),
      vnp_OrderType: vnp_OrderType,
      vnp_Locale: vnp_Locale,
      vnp_Return: vnp_Return,
      vnp_IpAddr: vnp_IpAddr,
      vnp_CreateDate: vnp_CreateDate,
      vnp_CurrCode: vnp_CurrCode,
      vnp_ExpireDate: vnp_ExpireDate
    };

    const queryString = Object.keys(data)
      .map((key) => `${key}=${encodeURIComponent(data[key])}`)
      .join('&');

    const signature = crypto.createHmac('sha512', hashSecret).update(queryString).digest('hex');
    const paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Version=${vnp_Version}&vnp_TmnCode=${tmnCode}&vnp_Command=${vnp_Command}&vnp_TxnRef=${vnp_TxnRef}&vnp_Amount=${vnp_Amount}&vnp_CurrCode=${vnp_CurrCode}&vnp_BankCode=&vnp_Locale=${vnp_Locale}&vnp_OrderInfo=${encodeURIComponent(vnp_OrderInfo)}&vnp_Return=${encodeURIComponent(vnp_Return)}&vnp_IpAddr=${vnp_IpAddr}&vnp_CreateDate=${vnp_CreateDate}&vnp_ExpireDate=${vnp_ExpireDate}&vnp_SecureHash=${signature}`;

    return { paymentUrl, data: { vnp_TxnRef: vnp_TxnRef, signature } };
  }

  verifyCallback(params: any): boolean {
    const { vnp_SecureHash, vnp_TxnRef, vnp_Amount, vnp_OrderInfo, vnp_ResponseTime, vnp_BankCode, vnp_CardType, vnp_TransactionStatus, vnp_TmnCode } = params;

    const data: Record<string, any> = {
      vnp_Amount: vnp_Amount,
      vnp_BankCode: vnp_BankCode,
      vnp_CardType: vnp_CardType,
      vnp_OrderInfo: vnp_OrderInfo,
      vnp_ResponseTime: vnp_ResponseTime,
      vnp_TmnCode: vnp_TmnCode,
      vnp_TransactionStatus: vnp_TransactionStatus,
      vnp_TxnRef: vnp_TxnRef
    };

    const queryString = Object.keys(data)
      .filter(k => data[k] !== undefined && data[k] !== '')
      .map((key) => `${key}=${encodeURIComponent(data[key])}`)
      .join('&');

    const expected = crypto.createHmac('sha512', this.config.hashSecret).update(queryString).digest('hex');
    return expected === vnp_SecureHash;
  }
}

export function createPaymentService(config: PaymentConfig) {
  return {
    momo: new MomoPaymentService(config.momo),
    vnpay: new VNPayPaymentService(config.vnpay)
  };
}
