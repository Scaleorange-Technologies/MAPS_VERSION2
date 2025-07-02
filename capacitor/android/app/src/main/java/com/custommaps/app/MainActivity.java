package com.scaleorange.maps;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleIntent(intent);
    }

private void handleIntent(Intent intent) {
    if (intent == null) {
        Log.e("GeoIntent", "Intent is null");
        return;
    }
    Uri data = intent.getData();
    Log.d("GeoIntent", "Incoming intent: " + intent);
    if (data != null) {
        Log.d("GeoIntent", "Intent data: " + data.toString());
        String scheme = data.getScheme();
        Double lat = null, lng = null;
        if ("geo".equals(scheme)) {
            String geo = data.getSchemeSpecificPart();
            Log.d("GeoIntent", "Geo string: " + geo);
            String[] parts = geo.split("\\?");
            String[] coords = parts[0].split(",");
            if (coords.length >= 2) {
                try {
                    lat = Double.parseDouble(coords[0]);
                    lng = Double.parseDouble(coords[1]);
                } catch (Exception e) {
                    Log.e("GeoIntent", "Geo parsing error: " + e.getMessage());
                }
            }
        } else if ("https".equals(scheme)) {
            String url = data.toString();
            Log.d("GeoIntent", "Google Maps url: " + url);
            Uri uri = Uri.parse(url);
            String q = uri.getQueryParameter("q");
            if (q != null) {
                String[] coords = q.split(",");
                if (coords.length >= 2) {
                    try {
                        lat = Double.parseDouble(coords[0]);
                        lng = Double.parseDouble(coords[1]);
                    } catch (Exception e) {
                        Log.e("GeoIntent", "Google Maps parsing error: " + e.getMessage());
                    }
                }
            }
        }
        if (lat != null && lng != null) {
            Log.d("GeoIntent", "Parsed lat: " + lat + ", lng: " + lng);
            final String js = "window.handleExternalLocation && window.handleExternalLocation(" + lat + "," + lng + ");";
            runOnUiThread(() -> {
                Log.d("GeoIntent", "Injecting JS: " + js);
                getBridge().getWebView().evaluateJavascript(js, null);
            });
        } else {
            Log.e("GeoIntent", "Lat/Lng not parsed from intent data");
        }
    } else {
        Log.e("GeoIntent", "Intent data is null");
    }
}
}