export const PASSWORD_RESET_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style type="text/css">
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #374151; background-color: #f3f4f6; margin: 0; padding: 0; }
        a { color: #8b5cf6; text-decoration: none; }
    </style>
</head>
<body>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
        <tr><td>
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
                <tr><td>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;">
                        <tr><td style="padding: 32px 32px 24px 32px; background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);"><h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">Stock Express</h1></td></tr>
                        <tr><td style="padding: 32px;">
                            <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700;">Reset Your Password</h2>
                            <p style="margin: 0 0 20px 0; color: #374151;">We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.</p>
                            <div style="margin: 32px 0; text-align: center;"><a href="RESET_LINK_PLACEHOLDER" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: #ffffff; border-radius: 8px; font-weight: 600;">Reset Password</a></div>
                            <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 12px; word-break: break-all;">Or copy this link:<br/><a href="RESET_LINK_PLACEHOLDER" style="color: #8b5cf6;">RESET_LINK_PLACEHOLDER</a></p>
                        </td></tr>
                        <tr><td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;"><p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">© {{year}} Stock Express</p></td></tr>
                    </table>
                </td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`;
