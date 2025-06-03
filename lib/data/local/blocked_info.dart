class BlockedInfo {
  final List<String> blockedUsers;
  final List<String> blockedByUsers;

  BlockedInfo.fromJson(Map<String, dynamic> json)
      : blockedUsers = json['blockedUserIds']?.cast<String>(),
        blockedByUsers = json['blockedByUserIds']?.cast<String>();

  bool isBlockedBy(String userId) => blockedByUsers.contains(userId);

  bool isBlocked(String userId) => blockedUsers.contains(userId);

  bool isBlockedOrBlockedBy(String userId) =>
      isBlocked(userId) || isBlockedBy(userId);

  @override
  String toString() {
    return 'BlockedInfo{blockedUsers: $blockedUsers, blockedByUsers: $blockedByUsers}';
  }
}
