// @ts-ignore
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import { Platform } from 'react-native';
import { Estimate, Invoice, Client, Settings } from '../models';
import { formatCurrency, formatDate } from './index';

export interface PDFGenerationResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export class PDFService {
  private static generateHTML(
    document: Estimate | Invoice,
    client: Client,
    settings: Settings,
    type: 'estimate' | 'invoice'
  ): string {
    const isInvoice = type === 'invoice';
    const title = isInvoice ? '发票' : '报价单';
    const documentNumber = isInvoice 
      ? (document as Invoice).invoiceNumber 
      : document.estimateNumber;

    const subtotal = document.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (document.taxRate / 100);
    const total = subtotal + taxAmount;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.4;
            }
            .header {
              border-bottom: 3px solid #2D6A4F;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-info {
              text-align: right;
              margin-bottom: 20px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #2D6A4F;
              margin-bottom: 5px;
            }
            .document-title {
              font-size: 28px;
              font-weight: bold;
              color: #2D6A4F;
              margin-bottom: 10px;
            }
            .document-number {
              font-size: 18px;
              color: #666;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #2D6A4F;
              margin-bottom: 10px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .two-column {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .column {
              width: 48%;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items-table th,
            .items-table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            .items-table th {
              background-color: #f8f9fa;
              font-weight: bold;
              color: #2D6A4F;
            }
            .items-table tr:nth-child(even) {
              background-color: #f8f9fa;
            }
            .amount-cell {
              text-align: right;
            }
            .totals-section {
              float: right;
              width: 300px;
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .total-row.final {
              font-weight: bold;
              font-size: 18px;
              border-bottom: 3px solid #2D6A4F;
              color: #2D6A4F;
            }
            .notes {
              margin-top: 30px;
              padding: 15px;
              background-color: #f8f9fa;
              border-left: 4px solid #2D6A4F;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <div class="company-name">${settings.companyName}</div>
              ${settings.address ? `<div>${settings.address}</div>` : ''}
              ${settings.phone ? `<div>电话: ${settings.phone}</div>` : ''}
              ${settings.email ? `<div>邮箱: ${settings.email}</div>` : ''}
            </div>
            
            <div class="document-title">${title}</div>
            <div class="document-number">编号: ${documentNumber}</div>
          </div>

          <div class="two-column">
            <div class="column">
              <div class="section-title">客户信息</div>
              <div><strong>${client.name}</strong></div>
              ${client.company ? `<div>${client.company}</div>` : ''}
              ${client.address ? `<div>${client.address}</div>` : ''}
              ${client.phone ? `<div>电话: ${client.phone}</div>` : ''}
              ${client.email ? `<div>邮箱: ${client.email}</div>` : ''}
            </div>
            
            <div class="column">
              <div class="section-title">${title}信息</div>
              <div><strong>签发日期:</strong> ${formatDate(document.issueDate)}</div>
              ${!isInvoice && document.validUntil ? 
                `<div><strong>有效期至:</strong> ${formatDate(document.validUntil)}</div>` : ''}
              ${isInvoice && (document as Invoice).dueDate ? 
                `<div><strong>到期日期:</strong> ${formatDate((document as Invoice).dueDate)}</div>` : ''}
              ${isInvoice ? 
                `<div><strong>付款状态:</strong> ${(document as Invoice).paid ? '已付款' : '未付款'}</div>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">项目明细</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>描述</th>
                  <th>数量</th>
                  <th>单位</th>
                  <th>单价</th>
                  <th class="amount-cell">小计</th>
                </tr>
              </thead>
              <tbody>
                ${document.items.map(item => `
                  <tr>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit === 'hours' ? '小时' : '天'}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td class="amount-cell">${formatCurrency(item.quantity * item.unitPrice)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="totals-section">
            <div class="total-row">
              <span>小计:</span>
              <span>${formatCurrency(subtotal)}</span>
            </div>
            <div class="total-row">
              <span>税费 (${document.taxRate}%):</span>
              <span>${formatCurrency(taxAmount)}</span>
            </div>
            <div class="total-row final">
              <span>总计:</span>
              <span>${formatCurrency(total)}</span>
            </div>
          </div>

          <div style="clear: both;"></div>

          ${document.notes ? `
            <div class="notes">
              <div class="section-title">备注</div>
              <div>${document.notes.replace(/\n/g, '<br>')}</div>
            </div>
          ` : ''}

          <div class="footer">
            <div>此${title}由 ${settings.companyName} 生成</div>
            <div>生成时间: ${formatDate(new Date().toISOString())}</div>
          </div>
        </body>
      </html>
    `;
  }

  static async generatePDF(
    document: Estimate | Invoice,
    client: Client,
    settings: Settings,
    type: 'estimate' | 'invoice'
  ): Promise<PDFGenerationResult> {
    try {
      const html = this.generateHTML(document, client, settings, type);
      
      const documentNumber = type === 'invoice' 
        ? (document as Invoice).invoiceNumber 
        : document.estimateNumber;
      
      const fileName = `${type === 'invoice' ? '发票' : '报价单'}_${documentNumber}_${Date.now()}.pdf`;
      
      const options = {
        html,
        fileName,
        directory: Platform.OS === 'ios' ? 'Documents' : 'Download',
        width: 612,
        height: 792,
        base64: false,
      };

      const pdf: any = await RNHTMLtoPDF.convert(options);
      
      return {
        success: true,
        filePath: pdf.filePath,
      };
    } catch (error) {
      console.error('PDF生成失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  static async generateAndSharePDF(
    document: Estimate | Invoice,
    client: Client,
    settings: Settings,
    type: 'estimate' | 'invoice'
  ): Promise<PDFGenerationResult> {
    try {
      const result = await this.generatePDF(document, client, settings, type);
      
      if (!result.success || !result.filePath) {
        return result;
      }

      const documentNumber = type === 'invoice' 
        ? (document as Invoice).invoiceNumber 
        : document.estimateNumber;
      
      const title = type === 'invoice' ? '发票' : '报价单';
      const shareTitle = `${title} ${documentNumber} - ${client.name}`;

      const shareOptions = {
        title: shareTitle,
        message: `请查看附件中的${title}`,
        url: Platform.OS === 'ios' ? result.filePath : `file://${result.filePath}`,
        type: 'application/pdf',
      };

      await Share.open(shareOptions);
      
      return result;
    } catch (error) {
      console.error('PDF分享失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PDF分享失败',
      };
    }
  }

  static async previewHTML(
    document: Estimate | Invoice,
    client: Client,
    settings: Settings,
    type: 'estimate' | 'invoice'
  ): Promise<string> {
    return this.generateHTML(document, client, settings, type);
  }
} 