import axios from 'axios'

interface STKPushRequest {
  phoneNumber: string // format: 254712345678
  amount: number
  accountReference: string
  transactionDesc: string
}

interface STKPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

export class MpesaService {
  private baseURL = 'https://sandbox.safaricom.co.ke' // Use production URL for live
  private consumerKey = process.env.MPESA_CONSUMER_KEY!
  private consumerSecret = process.env.MPESA_CONSUMER_SECRET!
  private passkey = process.env.MPESA_PASSKEY!
  private shortCode = process.env.MPESA_SHORTCODE!

  // Get access token
  private async getAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64')
    
    const response = await axios.get(
      `${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    )

    return response.data.access_token
  }

  // Initiate STK Push
  async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    const token = await this.getAccessToken()
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
    
    // Generate password
    const password = Buffer.from(
      `${this.shortCode}${this.passkey}${timestamp}`
    ).toString('base64')

    const stkBody = {
      BusinessShortCode: this.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: request.amount,
      PartyA: request.phoneNumber,
      PartyB: this.shortCode,
      PhoneNumber: request.phoneNumber,
      CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`,
      AccountReference: request.accountReference,
      TransactionDesc: request.transactionDesc
    }

    const response = await axios.post(
      `${this.baseURL}/mpesa/stkpush/v1/processrequest`,
      stkBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data
  }

  // Check transaction status
  async checkTransactionStatus(checkoutRequestID: string) {
    const token = await this.getAccessToken()
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
    
    const password = Buffer.from(
      `${this.shortCode}${this.passkey}${timestamp}`
    ).toString('base64')

    const body = {
      BusinessShortCode: this.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID
    }

    const response = await axios.post(
      `${this.baseURL}/mpesa/stkpushquery/v1/query`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data
  }
}

export const mpesaService = new MpesaService()