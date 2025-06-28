import 'package:connectivity/connectivity.dart';

abstract class WifiInfo {
  Future<String> getIdentifier();
  Stream<String> onWifiChange();
}

class WifiInfoImpl extends WifiInfo {
  final _connectivity = Connectivity();

  @override
  Future<String> getIdentifier() async {
    return await _connectivity.getWifiName();
  }

  @override
  Stream<String> onWifiChange() async* {
    await for (final status in _connectivity.onConnectivityChanged) {
      if (status == ConnectivityResult.wifi) {
        yield await getIdentifier();
      } else {
        yield null;
      }
    }
  }
}
