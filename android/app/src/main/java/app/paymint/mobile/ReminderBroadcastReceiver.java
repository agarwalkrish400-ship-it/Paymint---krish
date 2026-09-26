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
            // Already uploaded, do not send 30-min reminder
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

        String notifTitle = "Kuchu puchu tum kaha ho...";
        String notifBody = "Screenshot upload karna Bhul gaye ?? (?" + amount + " coins waiting!)";

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
