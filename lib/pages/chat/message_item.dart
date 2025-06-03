import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:wi/config/colors.dart';
import 'package:wi/data/local/credentials.dart';
import 'package:wi/data/models/attachment.dart';
import 'package:wi/data/storage/attachments_storage.dart';
import 'package:wi/di.dart';
import 'package:wi/exts/all.dart';
import 'package:wi/widgets/attachment_preview.dart';
import 'package:wi/widgets/avatar.dart';
import 'package:wi/widgets/cache_image.dart';
import 'package:wi/widgets/frame_builder.dart';
import 'package:wi/widgets/image_background.dart';
import 'package:wi/widgets/overlay_inkwell.dart';

final _kTimestampFormat = DateFormat.jm();

class MessageItem extends StatelessWidget {
  final String senderId;
  final String senderImageUrl;
  final String selfImageUrl;
  final String text;
  final Timestamp created;
  final Timestamp delivered;
  final Timestamp seen;
  final List<Attachment> files;
  final List<Attachment> images;

  final Function(String) onImageTap;
  final Function onShowImagesTap;
  final Function(Attachment) onAttachmentTap;
  final Function onMarkAsSeen;

  MessageItem(
    String id, {
    this.senderId,
    this.senderImageUrl,
    this.selfImageUrl,
    this.text,
    this.created,
    this.delivered,
    this.seen,
    this.files,
    this.images = const [],
    this.onImageTap,
    this.onShowImagesTap,
    this.onAttachmentTap,
    this.onMarkAsSeen,
  }) : super(key: ValueKey(id));

  final _crendentials = getIt<Credentials>();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorSet = ColorSet.of(context);
    final isOwned = senderId == _crendentials.userId;
    final radius = Radius.circular(12);
    final color = isOwned
        ? colorSet.surface
        : theme.isDark
            ? Colors.grey[300]
            : Colors.black;
    final textColor = isOwned
        ? null
        : theme.isDark
            ? ColorSets.light.text
            : ColorSets.dark.text;
    final alignment =
        isOwned ? CrossAxisAlignment.end : CrossAxisAlignment.start;

    if (seen == null && !isOwned) {
      onMarkAsSeen();
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: alignment,
      children: <Widget>[
        LayoutBuilder(
          builder: (context, constraints) {
            final hasImages = images?.isNotEmpty == true;
            final hasFiles = files?.isNotEmpty == true;
            final hasEmbeds = hasImages || hasFiles;
            final showReadIndic = isOwned;
            final maxWidth = min(
              hasImages
                  ? constraints.maxWidth * 0.7
                  : constraints.maxWidth * 0.8,
              hasEmbeds ? 300.0 : double.infinity, // Allow text to be wider
            );
            return Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (!isOwned)
                  Avatar(
                    senderImageUrl ?? '',
                    size: 32,
                  ),
                SizedBox(width: 8),
                Container(
                  constraints: BoxConstraints(
                    minWidth: 100,
                    maxWidth: maxWidth,
                  ),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadiusDirectional.only(
                      topStart: radius,
                      topEnd: radius,
                      bottomStart: isOwned ? radius : Radius.circular(4),
                      bottomEnd: isOwned ? Radius.circular(4) : radius,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: alignment,
                      children: <Widget>[
                        if (hasImages) ...[
                          _ImagesPreview(
                            images,
                            onImageTap: onImageTap,
                            onShowImagesTap: onShowImagesTap,
                          ),
                        ],
                        if (hasImages && hasFiles) ...[
                          SizedBox(height: 4),
                        ],
                        if (hasFiles) ...[
                          ...files
                              .map((file) => AttachmentPreview(
                                    file,
                                    onTap: () => onAttachmentTap(file),
                                    onOwnMessage: isOwned,
                                  ))
                              .toList(),
                        ],
                        if (text?.isNotEmpty == true) ...[
                          Padding(
                            padding: EdgeInsets.only(
                              left: 8,
                              right: 8,
                              top: 8,
                            ),
                            child: _Text(
                              text: text,
                              color: textColor,
                            ),
                          ),
                        ],
                        Padding(
                          padding: EdgeInsets.only(
                            left: 8,
                            right: 8,
                            bottom: 8,
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _buildTimestamp(
                                context,
                                textColor,
                                showReadIndic,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SizedBox(width: 8),
                if (isOwned)
                  Avatar(
                    selfImageUrl ?? '',
                    size: 32,
                  ),
              ],
            );
          },
        ),
      ],
    );
  }

  _buildTimestamp(
    BuildContext context,
    Color defaultColor,
    bool showReadIndic,
  ) {
    final colorSet = ColorSet.of(context);
    return Padding(
      padding: const EdgeInsets.all(2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (showReadIndic) ...[
            Icon(
              delivered != null
                  ? seen != null
                      ? Icons.done_all
                      : Icons.done
                  : Icons.radio_button_unchecked,
              color: seen != null
                  ? colorSet.primary
                  : defaultColor?.withOpacity(0.8),
              size: delivered == null ? 12 : 16,
            ),
            SizedBox(width: 4),
          ],
          Text(
            _kTimestampFormat.format(created.toDate()),
            style: TextStyle(
              fontSize: 12,
              color: defaultColor?.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }
}

class _Text extends StatelessWidget {
  final String text;
  final Color color;

  _Text({@required this.text, @required this.color});

  @override
  Widget build(BuildContext context) {
    return Text(
      text ?? '',
      style: TextStyle(
        fontSize: 14,
        color: color,
      ),
    );
  }
}

class _ImagesPreview extends StatelessWidget {
  final List<Attachment> images;
  final Function onImageTap;
  final Function onShowImagesTap;

  _ImagesPreview(
    this.images, {
    @required this.onImageTap,
    @required this.onShowImagesTap,
  });

  final _storage = getIt<AttachmentsStorage>();

  @override
  Widget build(BuildContext context) {
    if (images == null) return SizedBox.shrink();
    if (images.length < 4) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: images
            .map(
              (image) {
                final index = images.indexOf(image);
                final isFirst = index == 0;
                final isLast = index == images.length - 1;
                final radius = Radius.circular(8);
                return ClipRRect(
                  borderRadius: BorderRadius.only(
                    topLeft: isFirst ? radius : Radius.zero,
                    topRight: isFirst ? radius : Radius.zero,
                    bottomLeft: isLast ? radius : Radius.zero,
                    bottomRight: isLast ? radius : Radius.zero,
                  ),
                  child: OverlayInkWell(
                    children: [
                      ImageBackground(
                        child: AspectRatio(
                          aspectRatio: image.aspectRatio != null
                              ? 1 / image.aspectRatio
                              : 4 / 3,
                          child: CacheImage(
                            image: _storage.getImageFile(
                              image.url,
                              source: CacheSource.messageImages,
                            ),
                          ),
                        ),
                      ),
                    ],
                    inkWell: InkWell(onTap: () => onImageTap(image.url)),
                  ),
                );
              },
            )
            .toList()
            .withDividers(SizedBox(height: 4)),
      );
    } else {
      return LayoutBuilder(
        builder: (context, constraints) {
          final gridSpacing = 4.0;
          final availableWidth = constraints.maxWidth - gridSpacing;
          final imageSize = availableWidth / 2;
          return ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    _Image(
                      images[0].url,
                      size: imageSize,
                      onTap: () => onImageTap(images[0].url),
                    ),
                    SizedBox(width: gridSpacing),
                    _Image(
                      images[1].url,
                      size: imageSize,
                      onTap: () => onImageTap(images[1].url),
                    ),
                  ],
                ),
                SizedBox(height: gridSpacing),
                Row(
                  children: <Widget>[
                    _Image(
                      images[2].url,
                      size: imageSize,
                      onTap: () => onImageTap(images[2].url),
                    ),
                    SizedBox(width: gridSpacing),
                    _Image(
                      images[3].url,
                      size: imageSize,
                      numberOfImages: images.length,
                      onTap: () {
                        if (images.length > 4) {
                          onShowImagesTap();
                        } else {
                          onImageTap(images[3].url);
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      );
    }
  }
}

class _Image extends StatelessWidget {
  final String url;
  final double size;
  final int numberOfImages;
  final Function onTap;

  _Image(
    this.url, {
    @required this.size,
    this.numberOfImages,
    this.onTap,
  });

  final _storage = getIt<AttachmentsStorage>();

  @override
  Widget build(BuildContext context) {
    return OverlayInkWell(
      inkWell: InkWell(
        onTap: onTap,
      ),
      children: <Widget>[
        ImageBackground(
          child: CacheImage(
            image: _storage.getImageFile(
              url,
              source: CacheSource.messageImages,
            ),
            width: size,
            height: size,
            fit: BoxFit.cover,
          ),
        ),
        if (numberOfImages != null && numberOfImages > 4)
          Container(
            width: size,
            height: size,
            color: Color(0xff262a50).withOpacity(0.5),
            child: Center(
              child: Text(
                '+${numberOfImages - 4}',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
