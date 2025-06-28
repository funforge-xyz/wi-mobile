import 'package:wi/data/local/blocked_info.dart';
import 'package:wi/data/models/nearby_users.dart';
import 'package:wi/data/remote/api/api.dart';
import 'package:wi/data/remote/api/api_call.dart';

extension UsersApi on Api {
  ApiCall<NearbyUsers> getNearbyUsers(String myId) {
    return ApiCall<NearbyUsers>.using(dio)
        .get('/api/users/$myId/nearby-users')
        .parseWith((json) => NearbyUsers.fromJson(json));
  }

  ApiCall<BlockedInfo> getBlockedInfo(String myId) {
    return ApiCall<BlockedInfo>.using(dio)
        .get('/api/users/$myId/blocked-users')
        .parseWith((json) => BlockedInfo.fromJson(json));
  }

  ApiCall<void> blockUser(String myId, String userId) {
    return ApiCall.using(dio).patch('/api/users/$myId/block/$userId');
  }

  ApiCall<void> unblockUser(String myId, String userId) {
    return ApiCall.using(dio).patch('/api/users/$myId/unblock/$userId');
  }
}
