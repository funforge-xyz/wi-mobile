import 'package:intl/intl.dart';
import 'package:wi/config/strings.dart';
import 'package:wi/di.dart';

final _formatjm = DateFormat.jm();
final _formatMMMd = DateFormat('MMM d');
final _formatMMMdy = DateFormat('MMM d, y');
final _formatMMMMd = DateFormat('MMMM d');
final _formatMMMMdy = DateFormat('MMMM d, y');
final _formatyyyyMMdd = DateFormat('yyyy-MM-dd');

final _strings = strings();
final Map<String, dynamic> _kRelativeTimeStrings = {
  'seconds': _strings.labelTimeJustNow,
  'minutes': {
    'future': {
      'short': _strings.labelTimeInXMinsShort,
      'full': _strings.labelTimeInXMins,
    },
    'past': {
      'short': _strings.labelTimeXMinsAgoShort,
      'full': _strings.labelTimeXMinsAgo,
    },
  },
  'hours': {
    'future': {
      'short': _strings.labelTimeInXHoursShort,
      'full': _strings.labelTimeInXHours,
    },
    'past': {
      'short': _strings.labelTimeXHoursAgoShort,
      'full': _strings.labelTimeXHoursAgo,
    },
  },
  'days': {
    'future': {
      'short': _strings.labelTimeInXDaysShort,
      'full': _strings.labelTimeInXDays,
    },
    'past': {
      'short': _strings.labelTimeXDaysAgoShort,
      'full': _strings.labelTimeXDaysAgo,
    },
  },
  'weeks': {
    'future': {
      'short': _strings.labelTimeInXWeeksShort,
      'full': _strings.labelTimeInXWeeks,
    },
    'past': {
      'short': _strings.labelTimeXWeeksAgoShort,
      'full': _strings.labelTimeXWeeksAgo,
    },
  },
  'months': {
    'future': {
      'short': _strings.labelTimeInXMonthsShort,
      'full': _strings.labelTimeInXMonths,
    },
    'past': {
      'short': _strings.labelTimeXMonthsAgoShort,
      'full': _strings.labelTimeXMonthsAgo,
    },
  },
  'years': {
    'future': {
      'short': _strings.labelTimeInXYearsShort,
      'full': _strings.labelTimeInXYears,
    },
    'past': {
      'short': _strings.labelTimeXYearsAgoShort,
      'full': _strings.labelTimeXYearsAgo,
    },
  },
};

extension DateTimeExts on DateTime {
  DateTime get previousDay => this.subtract(Duration(days: 1));
  DateTime get nextDay => this.add(Duration(days: 1));
  DateTime get nextYear => this.add(Duration(days: 365));

  bool isToday() => this.isSameDay(DateTime.now());

  bool isTomorrow() => this.isSameDay(DateTime.now().nextDay);

  bool isYesterday() => this.isSameDay(DateTime.now().previousDay);

  bool isThisYear() => this.year == DateTime.now().year;

  bool isBeforeNow() {
    return isBefore(DateTime.now());
  }

  bool isBeforeToday() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return isBefore(today);
  }

  bool isSameDay(DateTime other) {
    if (this == null || other == null) return false;
    return this.isSameMonth(other) && this.day == other.day;
  }

  bool isSameMonth(DateTime other) {
    if (this == null || other == null) return false;
    return this.year == other.year && this.month == other.month;
  }

  bool isFuture() => isAfter(DateTime.now());
  bool isPast() => isBefore(DateTime.now());

  /// Returns [DateTime] of the first day in the month this
  /// [DateTime] is in, without hour, minute, second, etc. info.
  DateTime get firstDateInThisMonth => DateTime(year, month, 1);

  /// Returns [DateTime] of the last day in the month this
  /// [DateTime] is in, without hour, minute, second, etc. info.
  DateTime get lastDateInThisMonth {
    return beginningOfNextMonth.subtract(new Duration(days: 1));
  }

  /// Returns [DateTime] of the last moment in the month this
  /// [DateTime] is in.
  ///
  /// This is the very end of the month.
  DateTime get lastMomentInThisMonth {
    return beginningOfNextMonth.subtract(new Duration(microseconds: 1));
  }

  int get numberOfDaysThisMonth {
    return beginningOfNextMonth.difference(beginningOfThisMonth).inDays;
  }

  /// Beginning of the day.
  DateTime get beginning => DateTime(this.year, this.month, this.day);

  /// End of the day.
  DateTime get end => DateTime(this.year, this.month, this.day + 1)
      .subtract(Duration(microseconds: 1));

  DateTime get beginningOfThisMonth => DateTime(this.year, this.month, 1);

  DateTime get beginningOfNextMonth {
    return (this.month < DateTime.december)
        ? DateTime(this.year, this.month + 1, 1)
        : DateTime(this.year + 1, 1, 1);
  }

  /// Returns the number of extra days at the beginning of a calendar
  /// table when the start of this month is something other than Monday.
  int get extraDaysStart {
    // date.weekday returns an int in the range of 1..7, Monday to Sunday,
    // respectively. Subtract 1 for this day itself and you know the number
    // of extras.
    return this.firstDateInThisMonth.weekday - 1;
  }

  /// Returns the number of extra days at the end of a calendar table
  /// when the end of currently visible month is something other than Sunday.
  int get extraDaysEnd {
    // date.weekday returns an int in the range of 1..7, Monday to Sunday,
    // respectively. Subtract this day from the week and you know the number
    // of extras.
    return 7 - this.lastDateInThisMonth.weekday;
  }

  /// Returns this DateTime without hour, minute, second, etc. information.
  DateTime startOfDay() => DateTime(year, month, day);

  bool isMonday() => weekday == DateTime.monday;
  bool isTuesday() => weekday == DateTime.tuesday;
  bool isWednesday() => weekday == DateTime.wednesday;
  bool isThursday() => weekday == DateTime.thursday;
  bool isFriday() => weekday == DateTime.friday;
  bool isSaturday() => weekday == DateTime.saturday;
  bool isSunday() => weekday == DateTime.sunday;
  bool isWeekend() => isSaturday() || isSunday();

  /// Returns human-readable date in relative format (e.g. "2m") if the date is
  /// in the past but no more than [breakpoint] hours before now. For dates
  /// earlier than [breakpoint] hours before now, returns [readable].
  ///
  /// For example, if [breakpoint] is 3, this function will return relative time
  /// for any date between now and and 3 hours ago.
  String relativeReadable({
    int breakpoint = 3,
    bool shortForm = true,
    bool showTime = true,
    bool showTimeIfToday = true,
    bool showTimeIfYesterday = true,
    bool showTimeIfTomorrow = true,
    bool abbrev = true,
    bool alwaysShowYear = false,
  }) {
    final now = DateTime.now();
    if (now.difference(this).abs().inHours < breakpoint) {
      return relative(shortForm: shortForm);
    } else {
      return readable(
        showTime: showTime,
        showTimeIfToday: showTimeIfToday,
        showTimeIfYesterday: showTimeIfYesterday,
        showTimeIfTomorrow: showTimeIfTomorrow,
        abbrev: abbrev,
        alwaysShowYear: alwaysShowYear,
      );
    }
  }

  /// Returns human-readable date in relative format (e.g. "2m" for 2 minutes).
  String relative({bool shortForm = true}) {
    final s = strings();
    final now = DateTime.now();
    final diff = now.difference(this).abs();
    final future = isFuture() ? 'future' : 'past';
    final short = shortForm ? 'short' : 'full';
    PluralString template;
    int amount;
    if (diff.inMinutes < 1) return s.labelTimeJustNow;
    if (diff.inHours < 1) {
      template = _kRelativeTimeStrings['minutes'][future][short];
      amount = diff.inMinutes;
    } else if (diff.inDays < 1) {
      template = _kRelativeTimeStrings['hours'][future][short];
      amount = diff.inHours;
    } else if (diff.inDays < 7) {
      amount = diff.inDays;
      template = _kRelativeTimeStrings['days'][future][short];
    } else if (diff.inDays < 30) {
      template = _kRelativeTimeStrings['weeks'][future][short];
      amount = (diff.inDays / 7).round();
    } else if (diff.inDays < 365) {
      template = _kRelativeTimeStrings['months'][future][short];
      amount = (diff.inDays / 30).round();
    } else {
      template = _kRelativeTimeStrings['years'][future][short];
      amount = (diff.inDays / 365).round();
    }
    return template.value(amount);
  }

  /// Returns human-readble date in the format of "MMM d, yyyy".
  /// If the date is in the current year, it will omit year
  /// information.
  ///
  /// - [abbrev] whether month should be abbreviated into three
  /// letters or not.
  String readableMMMdyyyy({
    bool abbrev = true,
    bool alwaysShowYear = false,
  }) {
    if (this == null) return '?';
    return this.isThisYear() && !alwaysShowYear
        ? (abbrev ? _formatMMMd : _formatMMMMd).format(this)
        : (abbrev ? _formatMMMdy : _formatMMMMdy).format(this);
  }

  /// Returns human-readable date/time in the format of one of the
  /// following:
  /// - 12:32 AM
  /// - Yesterday, 11:21 PM
  /// - Tomorrow, 1:22 PM
  /// - Apr 16
  /// - Apr 16, 1990
  /// - Apr 16, 2077
  ///
  /// - [showTime] whether time information should be shown or not.
  /// - [showTimeIfToday] whether time should be shown instead of "Today"
  /// when this date is today. If true, only time will be displayed. If
  /// false, only "Today" will be displayed.
  /// - [showTimeIfYesterday] whether to show time information after
  /// "Yesterday, ".
  /// - [showTimeIfTomorrow] whether to show time information after
  /// "Tomorrow, ".
  /// - [abbrev] whether month should be abbreviated into three
  /// letters or not.
  String readable({
    bool showTime = true,
    bool showTimeIfToday = true,
    bool showTimeIfYesterday = true,
    bool showTimeIfTomorrow = true,
    bool abbrev = true,
    bool alwaysShowYear = false,
  }) {
    if (this == null) return '?';

    final s = strings();

    String result;

    final timeFormat = _formatjm;
    if (isToday()) {
      if (showTime && showTimeIfToday) {
        result = timeFormat.format(this);
      } else {
        result = s.labelCommonToday;
      }
    } else if (isYesterday()) {
      if (showTime && showTimeIfYesterday) {
        result = '${s.labelCommonYesterday}, ${timeFormat.format(this)}';
      } else {
        result = s.labelCommonYesterday;
      }
    } else if (isTomorrow()) {
      if (showTime && showTimeIfTomorrow) {
        result = '${s.labelCommonTomorrow}, ${timeFormat.format(this)}';
      } else {
        result = s.labelCommonTomorrow;
      }
    } else {
      result = readableMMMdyyyy(
        abbrev: abbrev,
        alwaysShowYear: alwaysShowYear,
      );
    }

    return result;
  }

  String yyyyMMdd() {
    if (this == null) return null;
    return _formatyyyyMMdd.format(this);
  }
}

extension LastSeenExt on DateTime {
  String formatAsLastSeen() {
    if (isToday()) {
      return readable(showTime: true).toLowerCase();
    } else if (isYesterday()) {
      return readable(showTime: true).toLowerCase();
    } else {
      return readableMMMdyyyy();
    }
  }
}
