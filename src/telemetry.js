// ─── PAYMINT BETA PAYMENT DETECTION & TELEMETRY CLIENT ─────────────────────

/**
 * Log a payment detection event to the Neon database via API
 */
export async function logPaymentDetection({
  payment_app = 'Unknown',
  amount = null,
  merchant = null,
  raw_title = '',
  raw_text = '',
  status = 'detected',
  user = null
}) {
  try {
    const token = localStorage.getItem('paymint_token') || '';
    const storedUser = user || JSON.parse(localStorage.getItem('paymint_user') || '{}');

    const res = await fetch('/api/telemetry/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        payment_app,
        amount,
        merchant,
        raw_title,
        raw_text,
        status,
        user_email: storedUser.email,
        user_name: storedUser.name
      })
    });
    const data = await res.json();
    return data?.data || null;
  } catch (err) {
    console.warn('[Telemetry] Failed to log detection:', err);
    return null;
  }
}

/**
 * Update the status of a logged detection (e.g. 'clicked', 'uploaded', 'dismissed')
 */
export async function updateDetectionStatus(id, status) {
  if (!id) return;
  try {
    const token = localStorage.getItem('paymint_token') || '';
    await fetch('/api/telemetry/log', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ id, status })
    });
  } catch (err) {
    console.warn('[Telemetry] Failed to update status:', err);
  }
}

/**
 * Listen for native Android notification events (via Capacitor window bridge)
 */
export function setupPaymentNotificationBridge(onPaymentDetected) {
  if (typeof window === 'undefined') return () => {};

  const handleNativeEvent = (event) => {
    const detail = event.detail || {};
    if (detail && detail.amount) {
      logPaymentDetection({
        payment_app: detail.payment_app || 'UPI',
        amount: detail.amount,
        merchant: detail.merchant,
        raw_title: detail.title,
        raw_text: detail.text,
        status: 'detected'
      }).then(logged => {
        if (onPaymentDetected) {
          onPaymentDetected({ ...detail, telemetryId: logged?.id });
        }
      });
    }
  };

  window.addEventListener('paymint_payment_detected', handleNativeEvent);

  return () => {
    window.removeEventListener('paymint_payment_detected', handleNativeEvent);
  };
}
