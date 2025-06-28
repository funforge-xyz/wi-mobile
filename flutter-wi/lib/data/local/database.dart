import 'package:hive/hive.dart';
import 'package:wi/data/models/nearby_users.dart';
import 'package:wi/data/models/posts.dart';
import 'package:wi/data/models/profile.dart';

abstract class Database {
  bool get profileExists;
  ProfileModel getProfile();
  putProfile(ProfileModel profile);

  bool get postsExist;
  Posts getPosts();
  putPosts(Posts posts);
  removePost(String id);

  bool get nearbyUsersExist;
  NearbyUsers getNearbyUsers();
  putNearbyUsers(NearbyUsers users);

  Future clear();
}

final _kKeyProfile = 'profile';
final _kKeyPosts = 'posts';
final _kKeyNearbyUsers = 'nearby_users';

class DatabaseImpl extends Database {
  Box _box;

  init() async {
    _box = await Hive.openBox('db');
  }

  @override
  bool get profileExists => _box.containsKey(_kKeyProfile);

  @override
  ProfileModel getProfile() {
    return _box.get(_kKeyProfile);
  }

  @override
  putProfile(ProfileModel profile) => _box.put(_kKeyProfile, profile);

  @override
  bool get postsExist => _box.containsKey(_kKeyPosts);

  @override
  Posts getPosts() {
    return _box.get(_kKeyPosts);
  }

  @override
  putPosts(Posts posts) => _box.put(_kKeyPosts, posts);

  @override
  removePost(String id) {
    final posts = getPosts();
    posts?.data?.removeWhere((post) => post.id == id);
    putPosts(posts);
  }

  @override
  bool get nearbyUsersExist => _box.containsKey(_kKeyNearbyUsers);

  @override
  NearbyUsers getNearbyUsers() {
    return _box.get(_kKeyNearbyUsers);
  }

  @override
  putNearbyUsers(NearbyUsers users) => _box.put(_kKeyNearbyUsers, users);

  @override
  Future clear() {
    return _box.clear();
  }
}
