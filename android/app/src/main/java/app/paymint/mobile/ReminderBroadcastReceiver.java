package app.paymint.mobile;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;

public class ReminderBroadcastReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "paymint_payment_alerts";
    public static final String PREFS_NAME = "paymint_notif_prefs";
    public static final String KEY_PREFIX_UPLOADED = "uploaded_";
    public static final String KEY_REMINDER_ROTATION_INDEX = "reminder_rotation_index";

    private static class NotificationTemplate {
        String title;
        String bodyTemplate;

        NotificationTemplate(String title, String bodyTemplate) {
            this.title = title;
            this.bodyTemplate = bodyTemplate;
        }
    }

    // 30-Minute Follow-up Templates (Rotational)
    private static final NotificationTemplate[] REMINDER_TEMPLATES = {
        new NotificationTemplate(
            "Kuchu puchu tum kaha ho...",
            "Screenshot upload karna Bhul gaye ?? (?%s coins waiting!)"
        ),
        new NotificationTemplate(
            "Dost jaisa, screenshot waisa - kabhi time pe nahi ??",
            "30 mins hogaye! ?%s ka screenshot upload kardo abhi ??"
        )
    };

    @Override
    public void onReceive(Context context, Intent intent) {
        String txKey = intent.getStringExtra("tx_key");
        String amount = intent.getStringExtra("amount");
        String merchant = intent.getStringExtra("merchant");
        String appLabel = intent.getStringExtra("app");

        // Check if user already uploaded screenshot
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isUploaded = prefs.getBoolean(KEY_PREFIX_UPLOADED + txKey, false);

        if (isUploaded) {
            return;
        }

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

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openIntent.setAction(Intent.ACTION_VIEW);
        openIntent.setData(Uri.parse("paymint://upload?amount=" + amount + "&merchant=" + Uri.encode(merchant) + "&app=" + Uri.encode(appLabel) + "&reminder=30min"));

        PendingIntent pi = PendingIntent.getActivity(
            context,
            (int) System.currentTimeMillis(),
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        // Rotational selection for 30-min reminder
        int lastIndex = prefs.getInt(KEY_REMINDER_ROTATION_INDEX, -1);
        int nextIndex = (lastIndex + 1) % REMINDER_TEMPLATES.length;
        prefs.edit().putInt(KEY_REMINDER_ROTATION_INDEX, nextIndex).apply();

        NotificationTemplate template = REMINDER_TEMPLATES[nextIndex];
        String notifTitle = template.title;
        String notifBody;
        try {
            notifBody = String.format(template.bodyTemplate, amount);
        } catch (Exception e) {
            notifBody = "Screenshot upload karna Bhul gaye ?? (?" + amount + " coins waiting!)";
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(notifTitle)
            .setContentText(notifBody)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(notifBody))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pi);

        nm.notify((int) (System.currentTimeMillis() % 100000), builder.build());
    }
}
