import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'dummy_key');
}

// GET /api/test-email - Test email sending
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const to = searchParams.get('to');

    if (!to) {
      return NextResponse.json(
        { error: 'Please provide ?to=your@email.com in the URL' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY not set in environment variables' },
        { status: 500 }
      );
    }

    const result = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Market Sensor <onboarding@resend.dev>',
      to: [to],
      subject: '✅ Market Sensor Engine - Email Test',
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; text-align: center; }
    .content { background: white; padding: 30px; margin-top: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; color: #155724; }
    .footer { margin-top: 30px; text-align: center; color: #718096; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Email Test Successful!</h1>
    </div>
    <div class="content">
      <div class="success">
        <strong>Success!</strong> Your Market Sensor Engine email system is working correctly.
      </div>
      <p><strong>What this means:</strong></p>
      <ul>
        <li>✅ Resend API key is configured correctly</li>
        <li>✅ Email sending is functional</li>
        <li>✅ You'll receive Market Pulse reports when drift is detected</li>
      </ul>
      <p><strong>Next steps:</strong></p>
      <ol>
        <li>Add your top 3 competitors in the dashboard</li>
        <li>Run manual scans to create baselines</li>
        <li>Build your Proof Vault with evidence</li>
        <li>Weekly automated scans will run every Monday at 9 AM</li>
      </ol>
    </div>
    <div class="footer">
      <p>🤖 Market Sensor Engine</p>
      <p>Built with "Systems, Not Slides" framework by Ray Beharry</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      emailId: result.id,
      to,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
