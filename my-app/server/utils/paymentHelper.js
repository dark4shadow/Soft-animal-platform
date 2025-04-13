const crypto = require('crypto');

/**
 * Генерує форму для оплати через LiqPay
 * @param {Object} paymentData - Дані для платежу
 * @returns {Object} Об'єкт з URL та даними форми
 */
exports.generatePaymentForm = async (paymentData) => {
  const { orderId, amount, description, currency = 'UAH' } = paymentData;
  
  // В реальному проекті ці дані повинні бути в змінних середовища
  const publicKey = process.env.LIQPAY_PUBLIC_KEY || 'sandbox_public_key';
  const privateKey = process.env.LIQPAY_PRIVATE_KEY || 'sandbox_private_key';
  
  // Формуємо параметри для LiqPay
  const params = {
    public_key: publicKey,
    version: '3',
    action: 'pay',
    amount: amount,
    currency: currency,
    description: description,
    order_id: orderId,
    result_url: `${process.env.FRONTEND_URL}/donation/success`,
    server_url: `${process.env.API_URL}/api/payments/callback`
  };
  
  // Конвертуємо параметри в base64
  const data = Buffer.from(JSON.stringify(params)).toString('base64');
  
  // Генеруємо підпис
  const signature = crypto
    .createHash('sha1')
    .update(privateKey + data + privateKey)
    .digest('base64');
  
  return { 
    paymentUrl: 'https://www.liqpay.ua/api/3/checkout',
    formData: { data, signature }
  };
};

/**
 * Перевіряє підпис LiqPay для колбеків
 * @param {String} data - Data from LiqPay callback
 * @param {String} signature - Signature from LiqPay callback
 * @returns {Boolean} True якщо підпис дійсний
 */
exports.verifyLiqpaySignature = (data, signature) => {
  const privateKey = process.env.LIQPAY_PRIVATE_KEY || 'sandbox_private_key';
  
  const expectedSignature = crypto
    .createHash('sha1')
    .update(privateKey + data + privateKey)
    .digest('base64');
  
  return expectedSignature === signature;
};