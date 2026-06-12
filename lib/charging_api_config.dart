import 'package:flutter/foundation.dart';

/// Şarj proxy (Cloudflare Worker veya yerel `ocm_api`).
///
/// **Debug:** tanım yoksa yerel (`10.0.2.2:8787` / `127.0.0.1:8787`).
/// **Release:** `--dart-define=CHARGING_API_BASE_URL=...` yoksa canlı Worker URL;
/// `CHARGING_API_SECRET` zorunlu (Worker `API_SECRET`).
class ChargingApiConfig {
  const ChargingApiConfig._();

  static const String productionBaseUrl =
      'https://ocm-api.ridvanekinci92.workers.dev';

  static const String _fromDefine = String.fromEnvironment(
    'CHARGING_API_BASE_URL',
  );
  static const String serverSecret = String.fromEnvironment(
    'CHARGING_API_SECRET',
    defaultValue: '',
  );

  static String get baseUrl {
    final env = _fromDefine.trim();
    if (env.isNotEmpty) return _stripTrailingSlash(env);
    if (kDebugMode) {
      if (defaultTargetPlatform == TargetPlatform.android) {
        return 'http://10.0.2.2:8787';
      }
      return 'http://127.0.0.1:8787';
    }
    return productionBaseUrl;
  }

  static bool get isConfigured => baseUrl.isNotEmpty;

  /// Release / canlı URL kullanımında API anahtarı header'ı gerekir.
  static bool get requiresApiSecret {
    if (kReleaseMode) return true;
    return baseUrl == productionBaseUrl;
  }

  /// İstek öncesi kontrol; null ise hazır.
  static String? get configurationError {
    if (!isConfigured) {
      return 'Şarj API adresi tanımlı değil.';
    }
    if (kReleaseMode && _isLocalHost(baseUrl)) {
      return 'Release build yerel API kullanamaz.';
    }
    if (requiresApiSecret && serverSecret.isEmpty) {
      return 'CHARGING_API_SECRET gerekli. Örnek: '
          'flutter build apk --dart-define-from-file=dart_defines.prod.json';
    }
    return null;
  }

  static bool _isLocalHost(String url) {
    final u = url.toLowerCase();
    return u.contains('127.0.0.1') ||
        u.contains('localhost') ||
        u.contains('10.0.2.2');
  }

  static String _stripTrailingSlash(String url) {
    return url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }
}
