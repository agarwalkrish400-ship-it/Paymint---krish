package app.paymint.mobile;

import android.content.ComponentName;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Set;

@CapacitorPlugin(name = "NotificationAccess")
public class NotificationAccessPlugin extends Plugin {

    @PluginMethod
    public void isGranted(PluginCall call) {
        try {
            boolean enabled = isNotificationListenerEnabled();
            JSObject ret = new JSObject();
            ret.put("enabled", enabled);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to check notification access", e);
        }
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        try {
            Intent intent = null;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                try {
                    intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS);
                    ComponentName componentName = new ComponentName(getContext(), PaymentNotificationListener.class);
                    intent.putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, componentName.flattenToString());
                } catch (Exception e) {
                    intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
                }
            } else {
                intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            }
            if (intent == null) {
                intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            try {
                getContext().startActivity(intent);
            } catch (Exception ex) {
                Intent fallback = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
            }

            JSObject ret = new JSObject();
            ret.put("opened", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to open notification access settings", e);
        }
    }

    private boolean isNotificationListenerEnabled() {
        try {
            Set<String> packages = NotificationManagerCompat.getEnabledListenerPackages(getContext());
            String packageName = getContext().getPackageName();
            if (packages != null && packages.contains(packageName)) {
                return true;
            }
            String flat = Settings.Secure.getString(getContext().getContentResolver(), "enabled_notification_listeners");
            if (!TextUtils.isEmpty(flat)) {
                String[] names = flat.split(":");
                for (String name : names) {
                    ComponentName cn = ComponentName.unflattenFromString(name);
                    if (cn != null && TextUtils.equals(packageName, cn.getPackageName())) {
                        return true;
                    }
                }
            }
        } catch (Exception e) {
            Log.e("NotifAccessPlugin", "Error checking listener status", e);
        }
        return false;
    }
}
