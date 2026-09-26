package app.paymint.mobile;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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
    public static final String PREFS_NAME = "paymint_notif_prefs";
    public static final String KEY_ROTATION_INDEX = "last_rotation_index";

    // Known UPI / Payment App Packages
    private static final String[] PAYMENT_PACKAGES = {
        "com.google.android.apps.nbu.paisa.user", // Google Pay
        "com.phonepe.app",                       // PhonePe
        "net.one97.paytm",                        // Paytm
        "in.org.npci.upiapp",                     // BHIM
        "com.dreamplug.androidapp",               // CRED
        "com.whatsapp",                           // WhatsApp Pay
        "com.amazon.mShop.android.shopping"       // Amazon Pay
    };

    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
        "(?:(?:Rs\\.?|INR|?)\\s*([0-9,]+(?:\\.[0-9]{1,2})?))|(?:(?:paid|sent|debited)\\s*(?:Rs\\.?|INR|?)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?))",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern MERCHANT_PATTERN = Pattern.compile(
        "(?:to|at|for)\\s+([A-Za-z0-9\\s&'\\.-]{2,30})",
        Pattern.CASE_INSENSITIVE
    );

    private static class NotificationTemplate {
        String title;
        String body;

        NotificationTemplate(String title, String body) {
            this.title = title;
            this.body = body;
        }
    }

    // 7 Clean Creative Rotational Templates (No extra amount / app noise)
    private static final NotificationTemplate[] ROTATING_TEMPLATES = {
        new NotificationTemplate(
            "Payment hogaya kuchu puchu...",
            "Ab Screenshot bhi upload kardo ??"
        ),
        new NotificationTemplate(
            "Khula hain aao aake daldo...",
            "Payment ka screenshot aur kya ??"
        ),
        new NotificationTemplate(
            "Usne tumhe nahi Diya to kya hua hum dege tumhe... Rewards",
            "Ek baar daalke to dekho ... Screenshot ??"
        ),
        new NotificationTemplate(
            "Laal phool Neela phool,",
            "Paymint tumhara rewardfull! ??"
        ),
        new NotificationTemplate(
            "Ek photo, ek reward. Deal? ????",
            "Tap karke screenshot upload karo!"
        ),
        new NotificationTemplate(
            "Screenshot naa bheja toh...",
            "Reward bhi ghost kar dega ??"
        ),
        new NotificationTemplate(
            "Paisa gaya...",
            "Ab reward bhi jaane doge? (nahi na?) ??"
        )
    };

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

        Log.d(TAG, "Notification from " + appLabel + ": " + fullContent);

        String lower = fullContent.toLowerCase();
        boolean isDebit = lower.contains("paid") || lower.contains("sent") || lower.contains("debited") || 
                          lower.contains("transfer") || lower.contains("successful") || lower.contains("to ");

        if (!isDebit) return;

        String amount = null;
        Matcher amtMatcher = AMOUNT_PATTERN.matcher(fullContent);
        if (amtMatcher.find()) {
            amount = amtMatcher.group(1) != null ? amtMatcher.group(1) : amtMatcher.group(2);
            if (amount != null) amount = amount.replace(",", "").trim();
        }

        String merchant = "Store";
        Matcher merchMatcher = MERCHANT_PATTERN.matcher(fullContent);
        if (merchMatcher.find()) {
            merchant = merchMatcher.group(1).trim();
        }

        if (amount != null && !amount.isEmpty()) {
            showReminderNotification(this, appLabel, amount, merchant, title, text);
            schedule30MinReminder(this, appLabel, amount, merchant);
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
            channel.setDescription("Reminds you to upload screenshot after payments");
            nm.createNotificationChannel(channel);
        }

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

        // Strict round-robin rotation stored across app sessions
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int lastIndex = prefs.getInt(KEY_ROTATION_INDEX, -1);
        int nextIndex = (lastIndex + 1) % ROTATING_TEMPLATES.length;
        prefs.edit().putInt(KEY_ROTATION_INDEX, nextIndex).apply();

        NotificationTemplate template = ROTATING_TEMPLATES[nextIndex];

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(template.title)
            .setContentText(template.body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(template.body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pi);

        nm.notify((int) (System.currentTimeMillis() % 100000), builder.build());
    }

    private void schedule30MinReminder(Context context, String appLabel, String amount, String merchant) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            String txKey = amount + "_" + merchant + "_" + System.currentTimeMillis();

            Intent reminderIntent = new Intent(context, ReminderBroadcastReceiver.class);
            reminderIntent.putExtra("tx_key", txKey);
            reminderIntent.putExtra("amount", amount);
            reminderIntent.putExtra("merchant", merchant);
            reminderIntent.putExtra("app", appLabel);

            int requestCode = (int) (System.currentTimeMillis() % 100000);
            PendingIntent pi = PendingIntent.getBroadcast(
                context,
                requestCode,
                reminderIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            // 30 minutes in milliseconds (30 * 60 * 1000)
            long triggerAt = System.currentTimeMillis() + (30 * 60 * 1000L);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to schedule 30 min reminder", e);
        }
    }
}
