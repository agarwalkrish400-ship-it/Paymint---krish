package app.paymint.mobile;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PaymentNotificationListener extends NotificationListenerService {
    private static final String TAG = "PaymintPaymentListener";
    private static final String CHANNEL_ID = "paymint_payment_alerts";

    // Known UPI / Payment App Packages
    private static final String[] PAYMENT_PACKAGES = {
        "com.google.android.apps.nbu.paisa.user", // Google Pay (Tez)
        "com.phonepe.app",                       // PhonePe
        "net.one97.paytm",                        // Paytm
        "in.org.npci.upiapp",                     // BHIM
        "com.dreamplug.androidapp",               // CRED
        "com.whatsapp",                           // WhatsApp Pay
        "com.amazon.mShop.android.shopping"       // Amazon Pay
    };

    // Regex for payment detections (INR / Rs / ?)
    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
        "(?:(?:Rs\\.?|INR|?)\\s*([0-9,]+(?:\\.[0-9]{1,2})?))|(?:(?:paid|sent|debited)\\s*(?:Rs\\.?|INR|?)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?))",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern MERCHANT_PATTERN = Pattern.compile(
        "(?:to|at|for)\\s+([A-Za-z0-9\\s&'\\.-]{2,30})",
        Pattern.CASE_INSENSITIVE
    );

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) return;

        String packageName = sbn.getPackageName();
        boolean isPaymentApp = false;
        String appLabel = "UPI";

        for (String pkg : PAYMENT_PACKAGES) {
            if (pkg.equalsIgnoreCase(packageName)) {
                isPaymentApp = true;
                if (pkg.contains("paisa") || pkg.contains("google")) appLabel = "Google Pay";
                else if (pkg.contains("phonepe")) appLabel = "PhonePe";
                else if (pkg.contains("paytm")) appLabel = "Paytm";
                else if (pkg.contains("cred")) appLabel = "CRED";
                else if (pkg.contains("upiapp")) appLabel = "BHIM";
                break;
            }
        }

        if (!isPaymentApp) return;

        CharSequence titleCs = sbn.getNotification().extras.getCharSequence("android.title");
        CharSequence textCs = sbn.getNotification().extras.getCharSequence("android.text");
        String title = titleCs != null ? titleCs.toString() : "";
        String text = textCs != null ? textCs.toString() : "";
        String fullContent = title + " " + text;

        Log.d(TAG, "Notification received from " + appLabel + ": " + fullContent);

        // Check if this looks like a debit / outgoing payment
        String lower = fullContent.toLowerCase();
        boolean isDebit = lower.contains("paid") || lower.contains("sent") || lower.contains("debited") || 
                          lower.contains("transfer") || lower.contains("successful") || lower.contains("to ");

        if (!isDebit) return;

        // Parse amount
        String amount = null;
        Matcher amtMatcher = AMOUNT_PATTERN.matcher(fullContent);
        if (amtMatcher.find()) {
            amount = amtMatcher.group(1) != null ? amtMatcher.group(1) : amtMatcher.group(2);
            if (amount != null) amount = amount.replace(",", "").trim();
        }

        // Parse merchant/payee
        String merchant = "Merchant";
        Matcher merchMatcher = MERCHANT_PATTERN.matcher(fullContent);
        if (merchMatcher.find()) {
            merchant = merchMatcher.group(1).trim();
        }

        if (amount != null && !amount.isEmpty()) {
            showReminderNotification(this, appLabel, amount, merchant, title, text);
        }
    }

    private void showReminderNotification(Context context, String appLabel, String amount, String merchant, String title, String text) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Paymint Payment Reminders",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Reminds you to upload proof and earn coins after payments");
            nm.createNotificationChannel(channel);
        }

        // Deep link into Paymint with prefilled amount & merchant
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(Uri.parse("paymint://upload?amount=" + amount + "&merchant=" + Uri.encode(merchant) + "&app=" + Uri.encode(appLabel)));

        PendingIntent pi = PendingIntent.getActivity(
            context,
            (int) System.currentTimeMillis(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        String notifTitle = "?? Paid ?" + amount + " via " + appLabel + "?";
        String notifBody = "Tap here to upload proof & earn Paymint reward coins!";

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(notifTitle)
            .setContentText(notifBody)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pi);

        nm.notify((int) (System.currentTimeMillis() % 100000), builder.build());
    }
}
