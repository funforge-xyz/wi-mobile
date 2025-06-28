import 'package:wi/data/remote/api/api.dart';
import 'package:wi/data/remote/api/api_call.dart';
import 'package:wi/data/remote/resource.dart';
import 'package:wi/services/location.dart';

extension LocationsApi on Api {
  Future<Resource> reportLocation(String myId, Location location) {
    final call = ApiCall.using(dio).patch('/api/users/$myId/location').body({
      'lastUpdatedLatitude': location.latitude,
      'lastUpdatedLongitude': location.longitude,
    }).parseWith((json) => json);
    return call.execute();
  }
}
