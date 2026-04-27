import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'bildirim_screen.dart';
import 'message_store.dart';


// ─────────────────────────────────────────────
//  DATA
// ─────────────────────────────────────────────
class EvBrand {
  final String id, name, emoji;
  final Color color;
  final List<String> models;
  const EvBrand({required this.id, required this.name, required this.emoji,
    required this.color, required this.models});
}

class EvListing {
  final String id, brandId, model, location, sellerName, sellerInitials;
  final Color sellerColor;
  final int year, km, price, batteryHealth, range;
  final String chargeType, sellerType, damageStatus, postedAgo;
  final List<Color> gradient;
  final String emoji;
  final bool isFeatured;
  // Yeni alanlar
  final String color;
  final String warranty;
  final int acChargePower;   // kW
  final int dcChargePower;   // kW
  final int batteryCapacity; // kWh
  final int motorPower;      // hp
  final String drivetrain;   // Önden Çekiş / Arkadan İtiş / 4x4
  final List<String> paintedParts;
  final List<String> replacedParts;
  final List<String> photos; // file paths of uploaded photos

  const EvListing({
    required this.id, required this.brandId, required this.model,
    required this.location, required this.sellerName, required this.sellerInitials,
    required this.sellerColor, required this.year, required this.km,
    required this.price, required this.batteryHealth, required this.range,
    required this.chargeType, required this.sellerType, required this.damageStatus,
    required this.postedAgo, required this.gradient, required this.emoji,
    this.isFeatured = false,
    this.color = 'Beyaz',
    this.warranty = 'Yok',
    this.acChargePower = 11,
    this.dcChargePower = 150,
    this.batteryCapacity = 75,
    this.motorPower = 204,
    this.drivetrain = 'Arkadan İtiş',
    this.paintedParts = const [],
    this.replacedParts = const [],
    this.photos = const [],
  });
}

// ── Brands ───────────────────────────────────
const List<EvBrand> kEvBrands = [
  EvBrand(id:'tesla',   name:'Tesla',      emoji:'⚡', color:Color(0xFFCC0000),
    models:['Model 3','Model Y','Model S','Model X','Cybertruck']),
  EvBrand(id:'togg',    name:'Togg',       emoji:'🇹🇷', color:Color(0xFF2DC653),
    models:['T10X','T10F']),
  EvBrand(id:'bmw',     name:'BMW',        emoji:'🔵', color:Color(0xFF1C69D4),
    models:['i3','i4','i5','iX','iX3']),
  EvBrand(id:'hyundai', name:'Hyundai',    emoji:'🅗', color:Color(0xFF00287A),
    models:['IONIQ 5','IONIQ 6','KONA Electric']),
  EvBrand(id:'kia',     name:'Kia',        emoji:'🏁', color:Color(0xFF05141F),
    models:['EV3','EV6','EV9','Niro EV']),
  EvBrand(id:'porsche', name:'Porsche',    emoji:'🏆', color:Color(0xFFAE8753),
    models:['Taycan','Taycan Sport Turismo','Macan Electric']),
  EvBrand(id:'audi',    name:'Audi',       emoji:'⬤', color:Color(0xFFBB0A21),
    models:['e-tron','e-tron GT','Q4 e-tron','Q8 e-tron']),
  EvBrand(id:'volvo',   name:'Volvo',      emoji:'🛡', color:Color(0xFF003057),
    models:['XC40 Recharge','C40 Recharge','EX30','EX90']),
  EvBrand(id:'mercedes',name:'Mercedes',   emoji:'⭐', color:Color(0xFF1C1C1C),
    models:['EQA','EQB','EQC','EQE','EQS']),
  EvBrand(id:'renault', name:'Renault',    emoji:'💎', color:Color(0xFFD4A900),
    models:['Zoe','Megane E-Tech','Scenic E-Tech']),
  EvBrand(id:'vw',      name:'Volkswagen', emoji:'🚗', color:Color(0xFF1B3A6B),
    models:['ID.3','ID.4','ID.5','ID.7']),
  EvBrand(id:'nissan',  name:'Nissan',     emoji:'🌀', color:Color(0xFFC3002F),
    models:['Leaf','Ariya']),
  EvBrand(id:'peugeot', name:'Peugeot',    emoji:'🦁', color:Color(0xFF333333),
    models:['e-208','e-2008','e-308']),
  EvBrand(id:'ford',    name:'Ford',       emoji:'🔷', color:Color(0xFF003C8C),
    models:['Mustang Mach-E','Explorer EV']),
];

// ── Mock listings generator ───────────────────
const _mockPainted = [
  <String>[],
  ['Sol Ön Kapı', 'Sol Ön Çamurluk'],
  ['Kaput', 'Ön Tampon'],
  <String>[],
  ['Bagaj', 'Arka Tampon'],
  ['Sağ Arka Kapı'],
  <String>[],
  ['Tavan', 'Sol Arka Çamurluk'],
];
const _mockReplaced = [
  <String>[],
  ['Ön Tampon'],
  <String>[],
  ['Sol Arka Kapı', 'Arka Tampon'],
  <String>[],
  ['Kaput'],
  ['Sağ Ön Çamurluk', 'Sağ Ön Kapı'],
  <String>[],
];

List<EvListing> _generateListings(String brandId, String model) {
  final brand = kEvBrands.firstWhere((b) => b.id == brandId);
  final sellers = [
    ('Ahmet K.','AK',const Color(0xFFCC0000)),
    ('Merve S.','MS',const Color(0xFF2DC653)),
    ('Can D.',  'CD',const Color(0xFF1C69D4)),
    ('Elif T.', 'ET',const Color(0xFF9B59B6)),
    ('Burak A.','BA',const Color(0xFFEF9F27)),
    ('Selin Y.','SY',const Color(0xFFD4537E)),
    ('Mert K.', 'MK',const Color(0xFF378ADD)),
    ('Zeynep O.','ZO',const Color(0xFF20B2AA)),
    ('Emre B.', 'EB',const Color(0xFFFF6B35)),
    ('Ceren A.','CA',const Color(0xFF8E44AD)),
    ('Yusuf T.','YT',const Color(0xFF16A085)),
    ('Deniz P.','DP',const Color(0xFFE67E22)),
    ('Berk S.', 'BS',const Color(0xFF2980B9)),
    ('Ayşe M.','AM', const Color(0xFFC0392B)),
    ('Tolga R.','TR',const Color(0xFF27AE60)),
    ('Nur K.',  'NK',const Color(0xFF8B7000)),
  ];
  final years  = [2021,2022,2023,2023,2024,2022,2023,2024,
                  2021,2023,2022,2024,2023,2022,2024,2021];
  final kms    = [18500,34200,52000,8900,3200,41000,15600,6700,
                  27300,11200,48000,4100,22400,38700,9800,55000];
  final prices = [2850000,2150000,1780000,3100000,3450000,1950000,
                  2650000,3800000,1600000,2950000,1450000,4100000,
                  2300000,1850000,3550000,1380000];
  final bh     = [97,93,88,99,100,95,98,99,91,96,87,100,94,92,99,86];
  final ranges = [505,470,430,515,530,490,528,540,450,508,420,545,485,455,525,415];
  final types  = ['Sahibinden','Galeriden','Galeriden','Sahibinden','Sahibinden',
                  'Galeriden','Sahibinden','Sahibinden','Galeriden','Sahibinden',
                  'Galeriden','Sahibinden','Galeriden','Sahibinden','Sahibinden','Galeriden'];
  final damages= ['Kazasız','Kazasız','Kazalı','Kazasız','Kazasız',
                  'Kazasız','Kazasız','Kazasız','Kazalı','Kazasız',
                  'Kazalı','Kazasız','Kazasız','Kazalı','Kazasız','Kazasız'];
  final times  = ['30 dk önce','2 saat önce','1 gün önce','5 saat önce',
                  '20 dk önce','3 gün önce','4 saat önce','1 saat önce',
                  '2 gün önce','45 dk önce','4 gün önce','15 dk önce',
                  '6 saat önce','5 gün önce','3 saat önce','1 hafta önce'];

  final colors      = ['Beyaz','Siyah','Gri','Mavi','Kırmızı',
                       'Beyaz','Gümüş','Lacivert','Beyaz','Siyah',
                       'Kırmızı','Yeşil','Gri','Beyaz','Mavi','Siyah'];
  final warranties  = ['Yok','2 Yıl','Yok','3 Yıl','1 Yıl',
                       'Yok','Yok','2 Yıl','Yok','1 Yıl',
                       'Yok','3 Yıl','Yok','Yok','2 Yıl','Yok'];
  final acPowers    = [11,11,22,11,11,22,11,11,11,22,11,11,22,11,11,11];
  final dcPowers    = [150,250,150,350,150,100,150,250,50,350,150,200,150,135,150,50];
  final batteries   = [75,82,100,90,77,64,82,100,40,77,82,77,54,82,91,40];
  final motorPowers = [299,514,670,204,150,286,408,299,109,320,
                       204,218,136,204,480,109];
  final drivetrains = ['Arkadan İtiş','4x4','Arkadan İtiş','Arkadan İtiş',
                       'Önden Çekiş','Arkadan İtiş','4x4','Arkadan İtiş',
                       'Önden Çekiş','4x4','Önden Çekiş','Arkadan İtiş',
                       'Önden Çekiş','Arkadan İtiş','4x4','Önden Çekiş'];

  // Her ilan için 3-5 demo fotoğraf (seed tabanlı picsum)
  List<String> _mockPhotos(int i) {
    final seeds = [
      [10, 20, 30],
      [41, 51, 61, 71],
      [82, 92, 102],
      [113, 123, 133, 143],
      [154, 164, 174],
      [185, 195, 205, 215],
      [226, 236, 246],
      [257, 267, 277, 287],
      [298, 308, 318],
      [329, 339, 349, 359],
      [370, 380, 390],
      [401, 411, 421, 431],
      [442, 452, 462],
      [473, 483, 493, 503],
      [514, 524, 534],
      [545, 555, 565, 575],
    ];
    return seeds[i % seeds.length]
        .map((s) => 'https://picsum.photos/seed/$s/800/480')
        .toList();
  }

  return List.generate(16, (i) {
    final s = sellers[i];
    return EvListing(
      id: '${brandId}_${model}_$i',
      brandId: brandId, model: model,
      year: years[i], km: kms[i], price: prices[i],
      batteryHealth: bh[i], range: ranges[i], chargeType: 'CCS2',
      location: ['İstanbul','Ankara','İzmir','Bursa','Antalya',
                 'Adana','Konya','Gaziantep'][i % 8],
      sellerName: s.$1, sellerInitials: s.$2, sellerColor: s.$3,
      sellerType: types[i], damageStatus: damages[i],
      postedAgo: times[i],
      gradient: [
        Color.lerp(brand.color, Colors.black, 0.65)!,
        brand.color,
      ],
      emoji: brand.emoji,
      isFeatured: i == 0 || i == 4,
      color: colors[i],
      warranty: warranties[i],
      acChargePower: acPowers[i],
      dcChargePower: dcPowers[i],
      batteryCapacity: batteries[i],
      motorPower: motorPowers[i],
      drivetrain: drivetrains[i],
      paintedParts: _mockPainted[i % _mockPainted.length],
      replacedParts: _mockReplaced[i % _mockReplaced.length],
      photos: _mockPhotos(i),
    );
  });
}

// ─────────────────────────────────────────────
//  FOLLOW STORE
// ─────────────────────────────────────────────
class FollowStore {
  FollowStore._();
  static final instance = FollowStore._();

  final ValueNotifier<Set<String>> followed = ValueNotifier({});

  bool isFollowing(String id) => followed.value.contains(id);

  void toggle(String id, String title, BuildContext context) {
    final current = Set<String>.from(followed.value);
    if (current.contains(id)) {
      current.remove(id);
      followed.value = current;
      _showBanner(context, '🔕  Takip bırakıldı', const Color(0xFF5A7264));
    } else {
      current.add(id);
      followed.value = current;
      _showBanner(
        context,
        '🔔  Takibe alındı — fiyat düşünce bildirim alacaksın',
        EVColors.primary,
      );
      NotificationStore.instance.add(AppNotification(
        id: 'follow_$id',
        type: NotifType.system,
        title: 'Takip Başladı',
        body: '$title fiyat takibine alındı.',
        time: DateTime.now(),
      ));
      // Fiyat değişikliği simülasyonu (3 sn sonra)
      Future.delayed(const Duration(seconds: 3), () {
        if (instance.isFollowing(id)) {
          _showBanner(
            context,
            '📉  $title fiyatı düştü! Yeni fiyat güncellendi.',
            const Color(0xFF1C69D4),
          );
          NotificationStore.instance.add(AppNotification(
            id: 'price_${id}_${DateTime.now().millisecondsSinceEpoch}',
            type: NotifType.priceDown,
            title: 'Fiyat Düştü',
            body: '$title için yeni fiyat güncellendi.',
            time: DateTime.now(),
          ));
        }
      });
    }
  }

  void _showBanner(BuildContext context, String msg, Color color) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(
          fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white,
        )),
        backgroundColor: color,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
        duration: const Duration(seconds: 3),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  FILTER STATE
// ─────────────────────────────────────────────
enum DateSort  { none, newest, oldest }
enum PriceSort { none, highest, lowest }

class ListingFilter {
  final RangeValues priceRange;
  final RangeValues kmRange;
  final RangeValues yearRange;
  final String sellerType;
  final String damageStatus;
  final DateSort  dateSort;
  final PriceSort priceSort;

  const ListingFilter({
    this.priceRange   = const RangeValues(0, 5000000),
    this.kmRange      = const RangeValues(0, 200000),
    this.yearRange    = const RangeValues(2018, 2025),
    this.sellerType   = 'Tümü',
    this.damageStatus = 'Tümü',
    this.dateSort     = DateSort.none,
    this.priceSort    = PriceSort.none,
  });

  bool get isActive =>
      priceRange   != const RangeValues(0, 5000000) ||
      kmRange      != const RangeValues(0, 200000)  ||
      yearRange    != const RangeValues(2018, 2025) ||
      sellerType   != 'Tümü' ||
      damageStatus != 'Tümü' ||
      dateSort     != DateSort.none ||
      priceSort    != PriceSort.none;

  ListingFilter copyWith({
    RangeValues? priceRange, RangeValues? kmRange, RangeValues? yearRange,
    String? sellerType, String? damageStatus,
    DateSort? dateSort, PriceSort? priceSort,
  }) => ListingFilter(
    priceRange:   priceRange   ?? this.priceRange,
    kmRange:      kmRange      ?? this.kmRange,
    yearRange:    yearRange    ?? this.yearRange,
    sellerType:   sellerType   ?? this.sellerType,
    damageStatus: damageStatus ?? this.damageStatus,
    dateSort:     dateSort     ?? this.dateSort,
    priceSort:    priceSort    ?? this.priceSort,
  );

  bool matches(EvListing l) {
    if (l.price < priceRange.start || l.price > priceRange.end) return false;
    if (l.km    < kmRange.start    || l.km    > kmRange.end)    return false;
    if (l.year  < yearRange.start  || l.year  > yearRange.end)  return false;
    if (sellerType   != 'Tümü' && l.sellerType   != sellerType)   return false;
    if (damageStatus != 'Tümü' && l.damageStatus != damageStatus) return false;
    return true;
  }
}

// ─────────────────────────────────────────────
//  MAIN SCREEN
// ─────────────────────────────────────────────
class IkinciElScreen extends StatefulWidget {
  const IkinciElScreen({super.key});
  @override
  State<IkinciElScreen> createState() => _IkinciElScreenState();
}

class _IkinciElScreenState extends State<IkinciElScreen> {
  EvBrand? _brand;
  String   _model  = 'Tümü';
  ListingFilter _filter = const ListingFilter();

  List<EvListing> get _listings {
    if (_brand == null) return [];
    final all = _model == 'Tümü'
        ? _brand!.models.expand((m) => _generateListings(_brand!.id, m)).toList()
        : _generateListings(_brand!.id, _model);
    final filtered = all.where(_filter.matches).toList();

    // Önce tarihe göre sırala
    if (_filter.dateSort == DateSort.newest) {
      filtered.sort((a, b) => _postedMinutes(a).compareTo(_postedMinutes(b)));
    } else if (_filter.dateSort == DateSort.oldest) {
      filtered.sort((a, b) => _postedMinutes(b).compareTo(_postedMinutes(a)));
    }

    // Sonra fiyata göre sırala (stable sort — tarih sırası korunur eşit fiyatlarda)
    if (_filter.priceSort == PriceSort.highest) {
      filtered.sort((a, b) => b.price.compareTo(a.price));
    } else if (_filter.priceSort == PriceSort.lowest) {
      filtered.sort((a, b) => a.price.compareTo(b.price));
    }

    return filtered;
  }

  // Vitrin: tüm markalardan rastgele 16 ilan
  // Converts postedAgo string to minutes for sorting
  int _postedMinutes(EvListing l) {
    final s = l.postedAgo;
    if (s.contains('dk'))   return int.tryParse(s.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
    if (s.contains('saat')) return (int.tryParse(s.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0) * 60;
    if (s.contains('gün'))  return (int.tryParse(s.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0) * 1440;
    if (s.contains('hafta'))return (int.tryParse(s.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0) * 10080;
    return 0;
  }

  List<EvListing> get _vitrinListings {
    final all = <EvListing>[];
    for (final brand in kEvBrands) {
      all.add(_generateListings(brand.id, brand.models.first).first);
    }
    // deterministik shuffle (sabit sıra her build'de aynı kalsın)
    final picks = [3,7,1,11,5,13,0,9,2,12,6,10,4,8,14,15];
    return picks
        .where((i) => i < all.length)
        .map((i) => all[i % all.length])
        .toList();
  }

  void _pickBrand() {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _BrandPickerSheet(
        selected: _brand,
        onSelect: (b) {
          setState(() { _brand = b; _model = 'Tümü'; _filter = const ListingFilter(); });
          Navigator.pop(context);
        },
      ),
    );
  }

  void _pickModel() {
    if (_brand == null) return;
    HapticFeedback.lightImpact();
    final models = ['Tümü', ..._brand!.models];
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => Container(
        height: MediaQuery.of(context).size.height * 0.55,
        decoration: const BoxDecoration(
          color: EVColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(children: [
          Center(child: Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 8),
            child: Container(
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: EVColors.textHint.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          )),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
            child: Row(children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(
                  color: _brand!.color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(child: Text(_brand!.emoji,
                    style: const TextStyle(fontSize: 16))),
              ),
              const SizedBox(width: 10),
              Text('${_brand!.name} — Model Seç',
                style: const TextStyle(
                  fontSize: 17, fontWeight: FontWeight.w700,
                  color: EVColors.textPrimary,
                )),
            ]),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
              itemCount: models.length,
              itemBuilder: (_, i) {
                final m = models[i];
                final active = m == _model;
                return GestureDetector(
                  onTap: () {
                    setState(() { _model = m; _filter = const ListingFilter(); });
                    Navigator.pop(context);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: active
                          ? _brand!.color.withValues(alpha: 0.09)
                          : EVColors.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: active
                            ? _brand!.color.withValues(alpha: 0.45)
                            : EVColors.border,
                        width: active ? 1.5 : 1,
                      ),
                    ),
                    child: Row(children: [
                      Icon(
                        i == 0
                            ? Icons.grid_view_rounded
                            : Icons.directions_car_rounded,
                        size: 18,
                        color: active ? _brand!.color : EVColors.textHint,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(m, style: TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w600,
                          color: active
                              ? _brand!.color : EVColors.textPrimary,
                        )),
                      ),
                      if (active)
                        Icon(Icons.check_circle_rounded,
                            color: _brand!.color, size: 20),
                    ]),
                  ),
                );
              },
            ),
          ),
        ]),
      ),
    );
  }

  void _openFilter() async {
    HapticFeedback.lightImpact();
    final result = await showModalBottomSheet<ListingFilter>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _FilterSheet(current: _filter),
    );
    if (result != null) setState(() => _filter = result);
  }

  @override
  Widget build(BuildContext context) {
    final listings = _listings;
    final accentColor = _brand?.color ?? EVColors.primary;

    return Scaffold(
      backgroundColor: EVColors.background,
      floatingActionButton: _IlanVerFab(
        onTap: () {
          HapticFeedback.mediumImpact();
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (_) => const _NewListingSheet(),
          );
        },
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [

          // ── App bar ──────────────────────────────
          SliverToBoxAdapter(
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Row(children: [
                  // Geri butonu — model seçiliyse modeli, marka seçiliyse markayı temizler
                  if (_brand != null) ...[
                    GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        setState(() {
                          if (_model != 'Tümü') {
                            _model = 'Tümü';
                          } else {
                            _brand = null;
                            _model = 'Tümü';
                          }
                          _filter = const ListingFilter();
                        });
                      },
                      child: Container(
                        width: 38, height: 38,
                        margin: const EdgeInsets.only(right: 12),
                        decoration: BoxDecoration(
                          color: EVColors.surface,
                          shape: BoxShape.circle,
                          border: Border.all(color: EVColors.border),
                        ),
                        child: const Icon(Icons.arrow_back_rounded,
                            size: 18, color: EVColors.textPrimary),
                      ),
                    ),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_brand == null)
                          RichText(text: const TextSpan(children: [
                            TextSpan(text: '2. El ', style: TextStyle(
                              fontSize: 26, fontWeight: FontWeight.w800,
                              color: EVColors.primary, letterSpacing: -0.5,
                            )),
                            TextSpan(text: 'EV', style: TextStyle(
                              fontSize: 26, fontWeight: FontWeight.w800,
                              color: EVColors.textPrimary, letterSpacing: -0.5,
                            )),
                          ]))
                        else
                          Text(
                            _model == 'Tümü'
                                ? _brand!.name
                                : '${_brand!.name} · $_model',
                            style: const TextStyle(
                              fontSize: 20, fontWeight: FontWeight.w800,
                              color: EVColors.textPrimary, letterSpacing: -0.3,
                            ),
                          ),
                        Text(
                          _brand == null
                              ? 'Topluluktan güvenilir ilanlar'
                              : _model == 'Tümü'
                                  ? 'Model seç veya tümünü gör'
                                  : '${listings.length} ilan',
                          style: const TextStyle(
                              fontSize: 13, color: EVColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  if (_brand != null && listings.isNotEmpty)
                    _FilterButton(
                      active: _filter.isActive,
                      color: accentColor,
                      onTap: _openFilter,
                    ),
                ]),
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 16)),

          // ── Marka seçici ─────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: _SelectorButton(
                label: 'Marka',
                value: _brand?.name,
                emoji: _brand?.emoji,
                color: accentColor,
                onTap: _pickBrand,
              ),
            ),
          ),

          const SliverToBoxAdapter(child: SizedBox(height: 10)),

          // ── Model seçici ─────────────────────────
          if (_brand != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _SelectorButton(
                  label: 'Model',
                  value: _model,
                  emoji: _model == 'Tümü' ? null : _brand!.emoji,
                  color: _brand!.color,
                  onTap: () => _pickModel(),
                ),
              ),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 16)),

          // ── Vitrin ───────────────────────────────
          if (_brand == null) ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
                child: Row(
                  children: [
                    Container(
                      width: 4, height: 20,
                      decoration: BoxDecoration(
                        color: EVColors.primary,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Text('Vitrin', style: TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w800,
                      color: EVColors.textPrimary, letterSpacing: -0.3,
                    )),
                    const SizedBox(width: 8),
                    const Text('Öne Çıkan İlanlar', style: TextStyle(
                      fontSize: 13, color: EVColors.textSecondary,
                    )),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.72,
                ),
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => _GridCard(listing: _vitrinListings[i]),
                  childCount: _vitrinListings.length,
                ),
              ),
            ),
          ]

          // ── No results ───────────────────────────
          else if (listings.isEmpty)
            SliverFillRemaining(
              child: Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Text('🔍', style: TextStyle(fontSize: 40)),
                  const SizedBox(height: 12),
                  const Text('Uygun ilan bulunamadı', style: TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w600,
                    color: EVColors.textSecondary,
                  )),
                  if (_filter.isActive) ...[
                    const SizedBox(height: 10),
                    GestureDetector(
                      onTap: () =>
                          setState(() => _filter = const ListingFilter()),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: EVColors.primaryLight,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('Filtreleri Temizle',
                          style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600,
                            color: EVColors.primary,
                          )),
                      ),
                    ),
                  ],
                ]),
              ),
            )

          // ── Grid ─────────────────────────────────
          else ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                child: Row(children: [
                  Text('${listings.length} ilan', style: const TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w600,
                    color: EVColors.textSecondary,
                  )),
                  if (_filter.isActive) ...[
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () =>
                          setState(() => _filter = const ListingFilter()),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFE5E5),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('Temizle', style: TextStyle(
                          fontSize: 11, fontWeight: FontWeight.w600,
                          color: Color(0xFFD94F3D),
                        )),
                      ),
                    ),
                  ],
                ]),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 0.72,
                ),
                delegate: SliverChildBuilderDelegate(
                  (_, i) => _GridCard(listing: listings[i % listings.length]),
                  childCount: listings.length.clamp(0, 16),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  SELECTOR BUTTON
// ─────────────────────────────────────────────
class _SelectorButton extends StatelessWidget {
  final String label;
  final String? value, emoji;
  final Color color;
  final VoidCallback onTap;
  const _SelectorButton({required this.label, required this.color,
    required this.onTap, this.value, this.emoji});

  @override
  Widget build(BuildContext context) {
    final selected = value != null;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: selected
              ? color.withValues(alpha: 0.07)
              : EVColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? color.withValues(alpha: 0.4) : EVColors.border,
            width: selected ? 1.5 : 1.0,
          ),
        ),
        child: Row(children: [
          if (selected && emoji != null) ...[
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(child: Text(emoji!,
                  style: const TextStyle(fontSize: 16))),
            ),
            const SizedBox(width: 10),
          ] else ...[
            Icon(Icons.directions_car_rounded,
                size: 18,
                color: selected ? color : EVColors.textHint),
            const SizedBox(width: 10),
          ],
          Expanded(
            child: Text(
              selected ? value! : label,
              style: TextStyle(
                fontSize: 14, fontWeight: FontWeight.w600,
                color: selected ? color : EVColors.textHint,
              ),
            ),
          ),
          Text(selected ? 'Değiştir' : 'Seç',
            style: TextStyle(
              fontSize: 11, fontWeight: FontWeight.w500,
              color: selected ? color.withValues(alpha: 0.6) : EVColors.textHint,
            )),
          const SizedBox(width: 4),
          Icon(Icons.keyboard_arrow_down_rounded,
              size: 18,
              color: selected ? color.withValues(alpha: 0.6) : EVColors.textHint),
        ]),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  MODEL SELECTOR (artık kullanılmıyor — _pickModel ile değiştirildi)
// ─────────────────────────────────────────────
class _ModelSelector extends StatelessWidget {
  final EvBrand brand;
  final String selected;
  final ValueChanged<String> onChanged;
  const _ModelSelector({required this.brand, required this.selected,
    required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final all = ['Tümü', ...brand.models];
    return SizedBox(
      height: 38,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: all.length,
        itemBuilder: (_, i) {
          final m = all[i];
          final active = m == selected;
          return GestureDetector(
            onTap: () => onChanged(m),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: active ? brand.color : EVColors.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: active ? brand.color : EVColors.border,
                ),
              ),
              child: Text(m, style: TextStyle(
                fontSize: 12, fontWeight: FontWeight.w600,
                color: active ? Colors.white : EVColors.textSecondary,
              )),
            ),
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  BRAND PICKER SHEET
// ─────────────────────────────────────────────
class _BrandPickerSheet extends StatefulWidget {
  final EvBrand? selected;
  final ValueChanged<EvBrand> onSelect;
  const _BrandPickerSheet({required this.selected, required this.onSelect});

  @override
  State<_BrandPickerSheet> createState() => _BrandPickerSheetState();
}

class _BrandPickerSheetState extends State<_BrandPickerSheet> {
  final _ctrl = TextEditingController();
  String _q = '';

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  List<EvBrand> get _filtered => kEvBrands
      .where((b) => _q.isEmpty || b.name.toLowerCase().contains(_q))
      .toList();

  @override
  Widget build(BuildContext context) {
    final brands = _filtered;
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: EVColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(children: [
        // handle
        Center(child: Padding(
          padding: const EdgeInsets.only(top: 12, bottom: 8),
          child: Container(
            width: 36, height: 4,
            decoration: BoxDecoration(
              color: EVColors.textHint.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        )),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
          child: Column(children: [
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('Marka Seç', style: TextStyle(
                fontSize: 17, fontWeight: FontWeight.w700,
                color: EVColors.textPrimary,
              )),
            ),
            const SizedBox(height: 12),
            // search
            Container(
              height: 42,
              decoration: BoxDecoration(
                color: EVColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: EVColors.border),
              ),
              child: Row(children: [
                const SizedBox(width: 12),
                const Icon(Icons.search_rounded,
                    color: EVColors.textHint, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    onChanged: (v) => setState(() => _q = v.toLowerCase()),
                    style: const TextStyle(
                        fontSize: 14, color: EVColors.textPrimary),
                    decoration: const InputDecoration(
                      hintText: 'Marka ara…',
                      hintStyle: TextStyle(
                          color: EVColors.textHint, fontSize: 14),
                      border: InputBorder.none, isDense: true,
                    ),
                  ),
                ),
              ]),
            ),
          ]),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            itemCount: brands.length,
            itemBuilder: (_, i) {
              final b = brands[i];
              final active = b.id == widget.selected?.id;
              return GestureDetector(
                onTap: () => widget.onSelect(b),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: active
                        ? b.color.withValues(alpha: 0.09)
                        : EVColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: active
                          ? b.color.withValues(alpha: 0.45)
                          : EVColors.border,
                      width: active ? 1.5 : 1,
                    ),
                  ),
                  child: Row(children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: b.color.withValues(alpha: 0.10),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(child: Text(b.emoji,
                          style: const TextStyle(fontSize: 20))),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(b.name, style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w700,
                            color: EVColors.textPrimary,
                          )),
                          Text('${b.models.length} model',
                            style: const TextStyle(
                              fontSize: 11, color: EVColors.textSecondary,
                            )),
                        ],
                      ),
                    ),
                    if (active)
                      Icon(Icons.check_circle_rounded,
                          color: b.color, size: 20),
                  ]),
                ),
              );
            },
          ),
        ),
      ]),
    );
  }
}

// ─────────────────────────────────────────────
//  GRID CARD
// ─────────────────────────────────────────────
class _GridCard extends StatefulWidget {
  final EvListing listing;
  const _GridCard({required this.listing});
  @override
  State<_GridCard> createState() => _GridCardState();
}

class _GridCardState extends State<_GridCard> {

  String _fmt(int p) {
    if (p >= 1000000) {
      final m = p / 1000000;
      return '${m % 1 == 0 ? m.toInt() : m.toStringAsFixed(1)}M ₺';
    }
    return '${(p / 1000).toStringAsFixed(0)}K ₺';
  }

  @override
  Widget build(BuildContext context) {
    final listing = widget.listing;
    final damageColor = listing.damageStatus == 'Kazasız'
        ? EVColors.primary : const Color(0xFFD94F3D);

    return ValueListenableBuilder<Set<String>>(
      valueListenable: FollowStore.instance.followed,
      builder: (context, followed, _) {
        final isFollowed = followed.contains(listing.id);
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(
        builder: (_) => ListingDetailScreen(listing: listing),
      )),
      child: Container(
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: EVColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8, offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Görsel ───────────────────────────
            Expanded(
              child: Stack(children: [
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: listing.gradient,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(16)),
                  ),
                  child: Center(
                    child: Text(listing.emoji,
                        style: const TextStyle(fontSize: 44)),
                  ),
                ),
                // Featured
                if (listing.isFeatured)
                  Positioned(
                    top: 8, left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFD700),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text('★', style: TextStyle(
                        fontSize: 10, color: Colors.black87,
                        fontWeight: FontWeight.w700,
                      )),
                    ),
                  ),
                // Hasar badge
                Positioned(
                  top: 8, right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: damageColor.withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      listing.damageStatus == 'Kazasız' ? '✓' : '!',
                      style: const TextStyle(
                        fontSize: 10, color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                // Takip butonu
                Positioned(
                  bottom: 8, right: 8,
                  child: GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      FollowStore.instance.toggle(
                        listing.id,
                        '${listing.year} ${listing.model}',
                        context,
                      );
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 28, height: 28,
                      decoration: BoxDecoration(
                        color: isFollowed
                            ? EVColors.primary
                            : Colors.black.withValues(alpha: 0.4),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isFollowed
                            ? Icons.notifications_rounded
                            : Icons.notifications_none_rounded,
                        size: 15,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ]),
            ),

            // ── Bilgi ─────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${listing.year} ${listing.model}',
                    style: const TextStyle(
                      fontSize: 11, fontWeight: FontWeight.w700,
                      color: EVColors.textPrimary,
                    ),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text(_fmt(listing.price),
                    style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w800,
                      color: EVColors.primary,
                    )),
                  const SizedBox(height: 5),
                  Row(children: [
                    const Icon(Icons.speed_rounded,
                        size: 11, color: EVColors.textHint),
                    const SizedBox(width: 2),
                    Text('${(listing.km/1000).toStringAsFixed(0)}K',
                      style: const TextStyle(
                          fontSize: 10, color: EVColors.textSecondary)),
                    const SizedBox(width: 6),
                    const Icon(Icons.battery_charging_full_rounded,
                        size: 11, color: EVColors.textHint),
                    const SizedBox(width: 2),
                    Text('%${listing.batteryHealth}',
                      style: const TextStyle(
                          fontSize: 10, color: EVColors.textSecondary)),
                    const Spacer(),
                    Text(listing.location,
                      style: const TextStyle(
                          fontSize: 10, color: EVColors.textHint)),
                  ]),
                ],
              ),
            ),
          ],
        ),
      ),
    );
      },
    );
  }
}

// ─────────────────────────────────────────────
//  FILTER BUTTON
// ─────────────────────────────────────────────
class _FilterButton extends StatelessWidget {
  final bool active;
  final Color color;
  final VoidCallback onTap;
  const _FilterButton({required this.active, required this.color,
    required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: active ? color : EVColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: active ? color : EVColors.border),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.tune_rounded, size: 15,
            color: active ? Colors.white : EVColors.textSecondary),
        const SizedBox(width: 5),
        Text('Filtrele', style: TextStyle(
          fontSize: 12, fontWeight: FontWeight.w600,
          color: active ? Colors.white : EVColors.textSecondary,
        )),
      ]),
    ),
  );
}

// ─────────────────────────────────────────────
//  FILTER SHEET
// ─────────────────────────────────────────────
class _FilterSheet extends StatefulWidget {
  final ListingFilter current;
  const _FilterSheet({required this.current});
  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late ListingFilter _f;

  @override
  void initState() { super.initState(); _f = widget.current; }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          20, 0, 20, MediaQuery.of(context).viewInsets.bottom + 28),
      decoration: const BoxDecoration(
        color: EVColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
          Center(child: Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 8),
            child: Container(width: 36, height: 4,
              decoration: BoxDecoration(
                color: EVColors.textHint.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          )),
          Row(children: [
            const Text('Filtrele & Sırala', style: TextStyle(
              fontSize: 18, fontWeight: FontWeight.w700,
              color: EVColors.textPrimary,
            )),
            const Spacer(),
            GestureDetector(
              onTap: () => setState(() => _f = const ListingFilter()),
              child: const Text('Sıfırla', style: TextStyle(
                fontSize: 13, color: EVColors.primary,
                fontWeight: FontWeight.w600,
              )),
            ),
          ]),
          const SizedBox(height: 20),

          _sectionTitle('Sıralama'),
          const SizedBox(height: 10),
          _SortGroup(
            dateSort:       _f.dateSort,
            priceSort:      _f.priceSort,
            onDateChanged:  (v) => setState(() => _f = _f.copyWith(dateSort: v)),
            onPriceChanged: (v) => setState(() => _f = _f.copyWith(priceSort: v)),
          ),
          const SizedBox(height: 20),

          _sectionTitle('Fiyat Aralığı'),
          _rangeLabel(
            '${(_f.priceRange.start / 1000000).toStringAsFixed(1)}M ₺',
            '${(_f.priceRange.end   / 1000000).toStringAsFixed(1)}M ₺',
          ),
          RangeSlider(
            values: _f.priceRange, min: 0, max: 5000000, divisions: 50,
            activeColor: EVColors.primary, inactiveColor: EVColors.border,
            onChanged: (v) => setState(() => _f = _f.copyWith(priceRange: v)),
          ),
          const SizedBox(height: 8),

          _sectionTitle('Kilometre Aralığı'),
          _rangeLabel(
            '${(_f.kmRange.start / 1000).toStringAsFixed(0)}K km',
            '${(_f.kmRange.end   / 1000).toStringAsFixed(0)}K km',
          ),
          RangeSlider(
            values: _f.kmRange, min: 0, max: 200000, divisions: 40,
            activeColor: EVColors.primary, inactiveColor: EVColors.border,
            onChanged: (v) => setState(() => _f = _f.copyWith(kmRange: v)),
          ),
          const SizedBox(height: 8),

          _sectionTitle('Yıl Aralığı'),
          _rangeLabel(
            '${_f.yearRange.start.toInt()}',
            '${_f.yearRange.end.toInt()}',
          ),
          RangeSlider(
            values: _f.yearRange, min: 2018, max: 2025, divisions: 7,
            activeColor: EVColors.primary, inactiveColor: EVColors.border,
            onChanged: (v) => setState(() => _f = _f.copyWith(yearRange: v)),
          ),
          const SizedBox(height: 12),

          _sectionTitle('Kimden'),
          const SizedBox(height: 8),
          _ChipGroup(
            options: const ['Tümü', 'Sahibinden', 'Galeriden'],
            selected: _f.sellerType,
            onChanged: (v) => setState(() => _f = _f.copyWith(sellerType: v)),
          ),
          const SizedBox(height: 16),

          _sectionTitle('Hasar Durumu'),
          const SizedBox(height: 8),
          _ChipGroup(
            options: const ['Tümü', 'Kazasız', 'Kazalı'],
            selected: _f.damageStatus,
            colors: const {
              'Kazasız': EVColors.primary,
              'Kazalı':  Color(0xFFD94F3D),
            },
            onChanged: (v) =>
                setState(() => _f = _f.copyWith(damageStatus: v)),
          ),
          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: GestureDetector(
              onTap: () => Navigator.pop(context, _f),
              child: Container(
                height: 52,
                decoration: BoxDecoration(
                  color: EVColors.primary,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: EVColors.primary.withValues(alpha: 0.35),
                      blurRadius: 12, offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: const Center(child: Text('Filtreleri Uygula',
                  style: TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ))),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _sectionTitle(String t) => Padding(
    padding: const EdgeInsets.only(bottom: 4),
    child: Text(t, style: const TextStyle(
      fontSize: 13, fontWeight: FontWeight.w700,
      color: EVColors.textSecondary,
    )),
  );

  Widget _rangeLabel(String start, String end) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Text(start, style: const TextStyle(
          fontSize: 12, fontWeight: FontWeight.w600, color: EVColors.primary)),
      Text(end,   style: const TextStyle(
          fontSize: 12, fontWeight: FontWeight.w600, color: EVColors.primary)),
    ],
  );
}

// ─────────────────────────────────────────────
//  LISTING DETAIL SCREEN
// ─────────────────────────────────────────────
class ListingDetailScreen extends StatefulWidget {
  final EvListing listing;
  const ListingDetailScreen({super.key, required this.listing});
  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  int _currentPhoto = 0;
  late final PageController _pageCtrl;

  String _fmt(int p) {
    if (p >= 1000000) {
      final m = p / 1000000;
      return '${m % 1 == 0 ? m.toInt() : m.toStringAsFixed(1)}M ₺';
    }
    return '${(p / 1000).toStringAsFixed(0)}K ₺';
  }

  @override
  void initState() {
    super.initState();
    _pageCtrl = PageController();
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  void _openPhotoViewer(BuildContext context, List<String> photos, int index) {
    Navigator.of(context).push(PageRouteBuilder(
      opaque: false,
      barrierColor: Colors.transparent,
      pageBuilder: (_, __, ___) =>
          _PhotoViewerScreen(photos: photos, initialIndex: index),
      transitionsBuilder: (_, anim, __, child) =>
          FadeTransition(opacity: anim, child: child),
      transitionDuration: const Duration(milliseconds: 220),
    ));
  }

  Widget _buildPhotoHeader(EvListing listing) {
    final photos = listing.photos;
    if (photos.isEmpty) {
      return Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: listing.gradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(children: [
          Center(child: Text(listing.emoji,
              style: const TextStyle(fontSize: 80))),
          Positioned(
            bottom: 16, right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(_fmt(listing.price), style: const TextStyle(
                fontSize: 20, fontWeight: FontWeight.w800,
                color: Colors.white,
              )),
            ),
          ),
        ]),
      );
    }

    return Stack(
      children: [
        PageView.builder(
          controller: _pageCtrl,
          itemCount: photos.length,
          onPageChanged: (i) => setState(() => _currentPhoto = i),
          itemBuilder: (_, i) {
            final src = photos[i];
            final isNetwork = src.startsWith('http');
            final img = isNetwork
                ? Image.network(src, fit: BoxFit.cover, width: double.infinity,
                    loadingBuilder: (_, child, progress) => progress == null
                        ? child
                        : Container(color: Colors.black12,
                            child: const Center(
                                child: CircularProgressIndicator(strokeWidth: 2))))
                : Image.file(File(src), fit: BoxFit.cover, width: double.infinity);
            return GestureDetector(
              onTap: () => _openPhotoViewer(context, photos, i),
              child: img,
            );
          },
        ),
        // dot indicators
        Positioned(
          bottom: 14,
          left: 0, right: 0,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(photos.length, (i) => AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _currentPhoto == i ? 18 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _currentPhoto == i
                    ? Colors.white
                    : Colors.white.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(3),
              ),
            )),
          ),
        ),
        // price badge
        Positioned(
          bottom: 14, right: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.55),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Text(_fmt(listing.price), style: const TextStyle(
              fontSize: 20, fontWeight: FontWeight.w800,
              color: Colors.white,
            )),
          ),
        ),
        // photo counter
        Positioned(
          top: 12, right: 16,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.5),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${_currentPhoto + 1}/${photos.length}',
              style: const TextStyle(
                color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final listing = widget.listing;
    final damageColor = listing.damageStatus == 'Kazasız'
        ? EVColors.primary : const Color(0xFFD94F3D);
    return Scaffold(
      backgroundColor: EVColors.background,
      body: Stack(
        children: [
          SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Photo carousel ──────────────────────
                SizedBox(
                  height: 280,
                  child: _buildPhotoHeader(listing),
                ),

                // ── Detail content ───────────────────────
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${listing.year} ${listing.model}',
                        style: const TextStyle(
                          fontSize: 22, fontWeight: FontWeight.w800,
                          color: EVColors.textPrimary,
                        )),
                      const SizedBox(height: 8),
                      Row(children: [
                        _badge(listing.damageStatus,
                            damageColor.withValues(alpha: 0.12), damageColor),
                        const SizedBox(width: 8),
                        _badge(
                          listing.sellerType,
                          listing.sellerType == 'Sahibinden'
                              ? EVColors.primaryLight : const Color(0xFFE8F0FC),
                          listing.sellerType == 'Sahibinden'
                              ? EVColors.primary : const Color(0xFF1A5FA5),
                        ),
                      ]),
                      const SizedBox(height: 20),
                      _infoCard([
                        (Icons.speed_rounded, 'Kilometre',
                            '${(listing.km/1000).toStringAsFixed(1)}K km',
                            EVColors.textPrimary),
                        (Icons.battery_charging_full_rounded, 'Batarya Sağlığı',
                            '%${listing.batteryHealth}',
                            listing.batteryHealth >= 95
                                ? EVColors.primary : const Color(0xFFEF9F27)),
                        (Icons.electric_bolt_rounded, 'Menzil',
                            '${listing.range} km', EVColors.textPrimary),
                        (Icons.battery_full_rounded, 'Pil Kapasitesi',
                            '${listing.batteryCapacity} kWh', const Color(0xFF1C69D4)),
                        (Icons.ev_station_rounded, 'AC Şarj',
                            '${listing.acChargePower} kW', const Color(0xFF2DC653)),
                        (Icons.bolt_rounded, 'DC Şarj',
                            '${listing.dcChargePower} kW', const Color(0xFFEF9F27)),
                        (Icons.palette_rounded, 'Renk',
                            listing.color, EVColors.textPrimary),
                        (Icons.verified_user_rounded, 'Garanti',
                            listing.warranty,
                            listing.warranty == 'Yok'
                                ? EVColors.textHint : const Color(0xFF9B59B6)),
                        (Icons.car_crash_rounded, 'Hasar Durumu',
                            listing.damageStatus,
                            listing.damageStatus == 'Kazasız'
                                ? EVColors.primary : const Color(0xFFD94F3D)),
                        (Icons.speed_outlined, 'Motor Gücü',
                            '${listing.motorPower} HP',
                            const Color(0xFFEF9F27)),
                        (Icons.swap_horiz_rounded, 'Çekiş',
                            listing.drivetrain,
                            const Color(0xFF1C69D4)),
                        (Icons.calendar_today_rounded, 'Yıl',
                            '${listing.year}', EVColors.textPrimary),
                        (Icons.location_on_rounded, 'Konum',
                            listing.location, EVColors.textPrimary),
                      ]),
                      const SizedBox(height: 16),
                      _VehicleDiagram(
                        painted: listing.paintedParts,
                        replaced: listing.replacedParts,
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: EVColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: EVColors.border),
                        ),
                        child: Row(children: [
                          Container(
                            width: 44, height: 44,
                            decoration: BoxDecoration(
                              color: listing.sellerColor.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: Center(child: Text(listing.sellerInitials,
                              style: TextStyle(
                                fontSize: 15, fontWeight: FontWeight.w700,
                                color: listing.sellerColor,
                              ))),
                          ),
                          const SizedBox(width: 12),
                          Expanded(child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(listing.sellerName, style: const TextStyle(
                                fontSize: 14, fontWeight: FontWeight.w700,
                                color: EVColors.textPrimary,
                              )),
                              Text(listing.postedAgo, style: const TextStyle(
                                fontSize: 12, color: EVColors.textSecondary,
                              )),
                            ],
                          )),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: EVColors.primaryLight,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Row(mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.verified_rounded,
                                    size: 13, color: EVColors.primary),
                                SizedBox(width: 4),
                                Text('Topluluk', style: TextStyle(
                                  fontSize: 11, fontWeight: FontWeight.w600,
                                  color: EVColors.primary,
                                )),
                              ]),
                          ),
                        ]),
                      ),
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Floating back button ─────────────────────
          SafeArea(
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                margin: const EdgeInsets.all(12),
                width: 36, height: 36,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.35),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_rounded,
                    color: Colors.white, size: 18),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: ValueListenableBuilder<Set<String>>(
        valueListenable: FollowStore.instance.followed,
        builder: (context, followed, _) {
          final isFollowed = followed.contains(listing.id);
          return Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
            decoration: BoxDecoration(
              color: EVColors.surface,
              border: const Border(top: BorderSide(color: EVColors.border)),
              boxShadow: [BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 16, offset: const Offset(0, -4),
              )],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Takip Et butonu
                GestureDetector(
                  onTap: () {
                    HapticFeedback.mediumImpact();
                    FollowStore.instance.toggle(
                      listing.id,
                      '${listing.year} ${listing.model}',
                      context,
                    );
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    width: double.infinity,
                    height: 48,
                    decoration: BoxDecoration(
                      color: isFollowed
                          ? EVColors.primaryLight
                          : EVColors.primary,
                      borderRadius: BorderRadius.circular(14),
                      border: isFollowed
                          ? Border.all(color: EVColors.primary, width: 1.5)
                          : null,
                      boxShadow: isFollowed ? [] : [BoxShadow(
                        color: EVColors.primary.withValues(alpha: 0.35),
                        blurRadius: 12, offset: const Offset(0, 4),
                      )],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          isFollowed
                              ? Icons.notifications_active_rounded
                              : Icons.notifications_none_rounded,
                          size: 18,
                          color: isFollowed ? EVColors.primary : Colors.white,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          isFollowed ? 'Takip Ediliyor' : 'Fiyatı Takip Et',
                          style: TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w700,
                            color: isFollowed ? EVColors.primary : Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                // Mesaj & Ara
                Row(children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () {
                        HapticFeedback.lightImpact();
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          backgroundColor: Colors.transparent,
                          builder: (_) => _MessageComposeSheet(listing: listing),
                        );
                      },
                      child: Container(
                        height: 46,
                        decoration: BoxDecoration(
                          color: EVColors.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: EVColors.border, width: 1.5),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.chat_bubble_outline_rounded,
                                size: 16, color: EVColors.textSecondary),
                            SizedBox(width: 6),
                            Text('Mesaj', style: TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w600,
                              color: EVColors.textSecondary,
                            )),
                          ]),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Container(
                      height: 46,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1C69D4),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [BoxShadow(
                          color: const Color(0xFF1C69D4).withValues(alpha: 0.3),
                          blurRadius: 10, offset: const Offset(0, 4),
                        )],
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.phone_rounded,
                              size: 16, color: Colors.white),
                          SizedBox(width: 6),
                          Text('Ara', style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w700,
                            color: Colors.white,
                          )),
                        ]),
                    ),
                  ),
                ]),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _badge(String label, Color bg, Color fg) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(
      fontSize: 12, fontWeight: FontWeight.w600, color: fg,
    )),
  );

  Widget _infoCard(List<(IconData, String, String, Color)> rows) =>
    Container(
      decoration: BoxDecoration(
        color: EVColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: EVColors.border),
      ),
      child: Column(
        children: rows.asMap().entries.map((e) {
          final i = e.key;
          final r = e.value;
          return Column(children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(children: [
                Icon(r.$1, size: 16, color: r.$4),
                const SizedBox(width: 10),
                Text(r.$2, style: const TextStyle(
                  fontSize: 13, color: EVColors.textSecondary,
                )),
                const Spacer(),
                Text(r.$3, style: TextStyle(
                  fontSize: 13, fontWeight: FontWeight.w700,
                  color: r.$4,
                )),
              ]),
            ),
            if (i < rows.length - 1)
              const Divider(color: EVColors.divider, height: 1,
                  indent: 16, endIndent: 16),
          ]);
        }).toList(),
      ),
    );
}

// ─────────────────────────────────────────────
//  ARAÇ ŞEMASI — KAYDIRMALİ 5 GÖRÜNÜM
// ─────────────────────────────────────────────
class _VehicleDiagram extends StatefulWidget {
  final List<String> painted;
  final List<String> replaced;
  const _VehicleDiagram({required this.painted, required this.replaced});

  @override
  State<_VehicleDiagram> createState() => _VehicleDiagramState();
}

class _VehicleDiagramState extends State<_VehicleDiagram> {
  final _pageController = PageController();
  int _currentPage = 0;

  static const _pages = [
    _DiagramPageData(label: 'Ön Görünüm',  parts: ['Kaput', 'Ön Tampon'],                                                      layout: _DiagramLayout.front),
    _DiagramPageData(label: 'Sağ Taraf',   parts: ['Sağ Ön Çamurluk', 'Sağ Ön Kapı', 'Sağ Arka Kapı', 'Sağ Arka Çamurluk'],   layout: _DiagramLayout.side),
    _DiagramPageData(label: 'Arka Görünüm',parts: ['Bagaj', 'Arka Tampon'],                                                     layout: _DiagramLayout.rear),
    _DiagramPageData(label: 'Sol Taraf',   parts: ['Sol Ön Çamurluk', 'Sol Ön Kapı', 'Sol Arka Kapı', 'Sol Arka Çamurluk'],    layout: _DiagramLayout.side),
    _DiagramPageData(label: 'Tavan',       parts: ['Tavan'],                                                                    layout: _DiagramLayout.top),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Color _bg(String part) {
    if (widget.replaced.contains(part)) return const Color(0xFF3D1A1A);
    if (widget.painted.contains(part))  return const Color(0xFF3D2E0A);
    return const Color(0xFF1A2E20);
  }

  Color _border(String part) {
    if (widget.replaced.contains(part)) return const Color(0xFFD94F3D);
    if (widget.painted.contains(part))  return const Color(0xFFEF9F27);
    return const Color(0xFF2A4A32);
  }

  Color _text(String part) {
    if (widget.replaced.contains(part)) return const Color(0xFFFF8A80);
    if (widget.painted.contains(part))  return const Color(0xFFFFCC80);
    return const Color(0xFF6B9E78);
  }

  IconData? _icon(String part) {
    if (widget.replaced.contains(part)) return Icons.build_rounded;
    if (widget.painted.contains(part))  return Icons.format_paint_rounded;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final allClean = widget.painted.isEmpty && widget.replaced.isEmpty;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0F1F16),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1E3828)),
      ),
      child: Column(children: [
        // ── Başlık ───────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
          child: Row(children: [
            Container(
              width: 28, height: 28,
              decoration: BoxDecoration(
                color: EVColors.primary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.car_repair_rounded, size: 15, color: EVColors.primary),
            ),
            const SizedBox(width: 10),
            const Text('Hasar & Boya Şeması', style: TextStyle(
              fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white,
            )),
            const Spacer(),
            if (allClean)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: EVColors.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: EVColors.primary.withValues(alpha: 0.3)),
                ),
                child: const Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.verified_rounded, size: 12, color: EVColors.primary),
                  SizedBox(width: 4),
                  Text('Temiz', style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w700, color: EVColors.primary,
                  )),
                ]),
              ),
          ]),
        ),

        // ── Sayfa nokta göstergesi ───────────
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(_pages.length, (i) {
            final active = i == _currentPage;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: active ? 22 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: active ? EVColors.primary : const Color(0xFF2A4A32),
                borderRadius: BorderRadius.circular(3),
              ),
            );
          }),
        ),
        const SizedBox(height: 6),
        Text(
          _pages[_currentPage].label,
          style: const TextStyle(
            fontSize: 11, fontWeight: FontWeight.w600,
            color: Color(0xFF4A7A58), letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 10),

        // ── PageView ─────────────────────────
        SizedBox(
          height: 170,
          child: PageView.builder(
            controller: _pageController,
            itemCount: _pages.length,
            onPageChanged: (p) => setState(() => _currentPage = p),
            itemBuilder: (_, idx) {
              final data = _pages[idx];
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _buildLayout(data),
              );
            },
          ),
        ),

        // ── Lejant ──────────────────────────
        if (!allClean) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: const Divider(height: 1, color: Color(0xFF1E3828)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
            child: Row(children: [
              _LegendDot(color: const Color(0xFFEF9F27), label: 'Boyalı'),
              const SizedBox(width: 16),
              _LegendDot(color: const Color(0xFFD94F3D), label: 'Değişen'),
              const SizedBox(width: 16),
              _LegendDot(color: const Color(0xFF3A4A40), label: 'Orijinal'),
            ]),
          ),
        ] else
          const SizedBox(height: 14),
      ]),
    );
  }

  Widget _buildLayout(_DiagramPageData data) {
    switch (data.layout) {
      case _DiagramLayout.front:
        return _buildFrontRear(data.parts, isFront: true);
      case _DiagramLayout.rear:
        return _buildFrontRear(data.parts, isFront: false);
      case _DiagramLayout.side:
        return _buildSide(data.parts);
      case _DiagramLayout.top:
        return _buildTop(data.parts);
    }
  }

  // ── Ön / Arka görünüm ────────────────────────
  Widget _buildFrontRear(List<String> parts, {required bool isFront}) {
    final mainPart   = parts[0]; // Kaput / Bagaj
    final bumperPart = parts[1]; // Ön Tampon / Arka Tampon

    final mainRadius = isFront
        ? const BorderRadius.only(topLeft: Radius.circular(10), topRight: Radius.circular(10))
        : const BorderRadius.only(bottomLeft: Radius.circular(10), bottomRight: Radius.circular(10));
    final bumperRadius = isFront
        ? const BorderRadius.only(bottomLeft: Radius.circular(12), bottomRight: Radius.circular(12))
        : const BorderRadius.only(topLeft: Radius.circular(12), topRight: Radius.circular(12));
    final roofRadius = isFront
        ? const BorderRadius.vertical(top: Radius.circular(32))
        : const BorderRadius.vertical(bottom: Radius.circular(32));

    final roofWidget = Center(
      child: Container(
        width: 130, height: 20,
        decoration: BoxDecoration(
          color: const Color(0xFF162B1E),
          border: Border.all(color: const Color(0xFF1E3828)),
          borderRadius: roofRadius,
        ),
      ),
    );

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (isFront) ...[roofWidget, const SizedBox(height: 3)],
        _DiagramPartTile(
          label: mainPart, height: 62,
          bg: _bg(mainPart), border: _border(mainPart),
          textColor: _text(mainPart), icon: _icon(mainPart),
          radius: mainRadius,
        ),
        const SizedBox(height: 4),
        _DiagramPartTile(
          label: bumperPart, height: 42,
          bg: _bg(bumperPart), border: _border(bumperPart),
          textColor: _text(bumperPart), icon: _icon(bumperPart),
          radius: bumperRadius,
        ),
        if (!isFront) ...[const SizedBox(height: 3), roofWidget],
      ],
    );
  }

  // ── Yan görünüm ──────────────────────────────
  Widget _buildSide(List<String> parts) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Çatı silüeti
        Row(children: [
          const SizedBox(width: 32),
          Expanded(
            child: Container(
              height: 16,
              decoration: BoxDecoration(
                color: const Color(0xFF162B1E),
                border: Border.all(color: const Color(0xFF1E3828)),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
              ),
            ),
          ),
          const SizedBox(width: 32),
        ]),
        const SizedBox(height: 2),
        // 4 parça yan yana
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: parts.asMap().entries.map((e) {
            final i    = e.key;
            final part = e.value;
            final isFirst = i == 0;
            final isLast  = i == parts.length - 1;
            final radius = isFirst
                ? const BorderRadius.only(
                    bottomLeft: Radius.circular(12),
                    topLeft: Radius.circular(4))
                : isLast
                    ? const BorderRadius.only(
                        bottomRight: Radius.circular(12),
                        topRight: Radius.circular(4))
                    : BorderRadius.circular(4);
            return Expanded(
              flex: (isFirst || isLast) ? 3 : 4,
              child: Padding(
                padding: EdgeInsets.only(left: i > 0 ? 3 : 0),
                child: _DiagramPartTile(
                  label: part, height: 84,
                  bg: _bg(part), border: _border(part),
                  textColor: _text(part), icon: _icon(part),
                  radius: radius,
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 5),
        // Tekerlekler
        Row(children: [
          const SizedBox(width: 22),
          _WheelDot(), const Spacer(), _WheelDot(),
          const SizedBox(width: 22),
        ]),
      ],
    );
  }

  // ── Tavan görünümü ───────────────────────────
  Widget _buildTop(List<String> parts) {
    final part = parts[0];
    return Center(
      child: SizedBox(
        width: 170, height: 150,
        child: Stack(alignment: Alignment.center, children: [
          // Araç gövde dış hat
          Container(
            width: 150, height: 140,
            decoration: BoxDecoration(
              color: const Color(0xFF162B1E),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: const Color(0xFF1E3828)),
            ),
          ),
          // Tavan paneli
          _DiagramPartTile(
            label: part, height: 88, width: 116,
            bg: _bg(part), border: _border(part),
            textColor: _text(part), icon: _icon(part),
            radius: BorderRadius.circular(18),
          ),
          // Köşe çark yerleri
          ...[
            Alignment.topLeft, Alignment.topRight,
            Alignment.bottomLeft, Alignment.bottomRight,
          ].map((a) => Align(
            alignment: a,
            child: Container(
              width: 18, height: 28,
              margin: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFF0F1F16),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFF2A4A32)),
              ),
            ),
          )),
        ]),
      ),
    );
  }
}

enum _DiagramLayout { front, rear, side, top }

class _DiagramPageData {
  final String label;
  final List<String> parts;
  final _DiagramLayout layout;
  const _DiagramPageData({
    required this.label,
    required this.parts,
    required this.layout,
  });
}

class _DiagramPartTile extends StatelessWidget {
  final String label;
  final Color bg, border, textColor;
  final IconData? icon;
  final double height;
  final double? width;
  final BorderRadius radius;

  const _DiagramPartTile({
    required this.label,
    required this.height,
    required this.bg,
    required this.border,
    required this.textColor,
    required this.icon,
    required this.radius,
    this.width,
  });

  @override
  Widget build(BuildContext context) => Container(
    height: height,
    width: width,
    decoration: BoxDecoration(
      color: bg,
      borderRadius: radius,
      border: Border.all(color: border, width: icon != null ? 1.5 : 1),
    ),
    child: Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 11, color: textColor),
            const SizedBox(height: 3),
          ],
          Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 8.5,
              fontWeight: icon != null ? FontWeight.w700 : FontWeight.w500,
              color: textColor,
              height: 1.2,
            ),
          ),
        ],
      ),
    ),
  );
}

class _WheelDot extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
    width: 22, height: 22,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: const Color(0xFF0F1F16),
      border: Border.all(color: const Color(0xFF2A4A32), width: 2),
    ),
    child: Center(
      child: Container(
        width: 9, height: 9,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          color: Color(0xFF1A3022),
        ),
      ),
    ),
  );
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendDot({required this.color, required this.label});
  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(
      width: 10, height: 10,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(3),
        border: Border.all(color: color, width: 1.5),
      ),
    ),
    const SizedBox(width: 5),
    Text(label, style: const TextStyle(
      fontSize: 11, color: Color(0xFF6B9E78),
      fontWeight: FontWeight.w500,
    )),
  ]);
}

// ─────────────────────────────────────────────
//  INFO CELL (2-column grid item)
// ─────────────────────────────────────────────
class _InfoCell extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final Color color;
  const _InfoCell({required this.icon, required this.label,
      required this.value, required this.color});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          Container(
            width: 28, height: 28,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 15, color: color),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(label, style: const TextStyle(
              fontSize: 11, color: EVColors.textHint,
              fontWeight: FontWeight.w500,
            )),
          ),
        ]),
        const SizedBox(height: 6),
        Text(value, style: TextStyle(
          fontSize: 14, fontWeight: FontWeight.w800, color: color,
        )),
      ],
    ),
  );
}

// ─────────────────────────────────────────────
//  NEW LISTING SHEET
// ─────────────────────────────────────────────
class _NewListingSheet extends StatefulWidget {
  const _NewListingSheet();
  @override
  State<_NewListingSheet> createState() => _NewListingSheetState();
}

class _NewListingSheetState extends State<_NewListingSheet> {
  final _brandCtrl    = TextEditingController();
  final _modelCtrl    = TextEditingController();
  final _priceCtrl    = TextEditingController();
  final _kmCtrl       = TextEditingController();
  final _locationCtrl = TextEditingController();
  String _sellerType   = 'Sahibinden';
  String _damageStatus = 'Kazasız';
  final List<File> _photos = [];
  static const int _maxPhotos = 8;
  final _picker = ImagePicker();

  Future<void> _pickPhoto(ImageSource source) async {
    final xFile = await _picker.pickImage(
      source: source, imageQuality: 80, maxWidth: 1080,
    );
    if (xFile == null) return;
    if (!mounted) return;
    setState(() => _photos.add(File(xFile.path)));
  }

  void _showPhotoOptions() {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        margin: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(20),
        ),
        child: SafeArea(
          top: false,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const SizedBox(height: 8),
            Container(width: 36, height: 4,
              decoration: BoxDecoration(
                color: EVColors.textHint.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            _optionTile(Icons.camera_alt_rounded, 'Kamera ile Çek',
                () { Navigator.pop(context); _pickPhoto(ImageSource.camera); }),
            const Divider(height: 1, indent: 56),
            _optionTile(Icons.photo_library_rounded, 'Galeriden Seç',
                () { Navigator.pop(context); _pickPhoto(ImageSource.gallery); }),
            const SizedBox(height: 8),
          ]),
        ),
      ),
    );
  }

  Widget _optionTile(IconData icon, String label, VoidCallback onTap) =>
    ListTile(
      leading: Container(
        width: 36, height: 36,
        decoration: BoxDecoration(
          color: EVColors.primaryLight,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, size: 18, color: EVColors.primary),
      ),
      title: Text(label, style: const TextStyle(
        fontSize: 14, fontWeight: FontWeight.w600, color: EVColors.textPrimary,
      )),
      onTap: onTap,
    );

  @override
  void dispose() {
    _brandCtrl.dispose(); _modelCtrl.dispose();
    _priceCtrl.dispose(); _kmCtrl.dispose();
    _locationCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(20, 0, 20, bottom + 28),
      decoration: const BoxDecoration(
        color: EVColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
          Center(child: Padding(
            padding: const EdgeInsets.only(top: 14, bottom: 10),
            child: Container(width: 36, height: 4,
              decoration: BoxDecoration(
                color: EVColors.textHint.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          )),
          const SizedBox(height: 20),
          Row(children: [
            const Text('İlan Ver', style: TextStyle(
              fontSize: 18, fontWeight: FontWeight.w700,
              color: EVColors.textPrimary,
            )),
            const Spacer(),
            GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                width: 34, height: 34,
                decoration: BoxDecoration(
                  color: EVColors.divider,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close_rounded,
                    size: 18, color: EVColors.textSecondary),
              ),
            ),
          ]),
          const SizedBox(height: 4),
          const SizedBox(height: 20),

          // ── Fotoğraflar ─────────────────────────
          Row(children: [
            const Text('Fotoğraflar', style: TextStyle(
              fontSize: 12, fontWeight: FontWeight.w600,
              color: EVColors.textSecondary,
            )),
            const SizedBox(width: 6),
            Text('${_photos.length}/$_maxPhotos', style: const TextStyle(
              fontSize: 12, color: EVColors.textHint,
            )),
          ]),
          const SizedBox(height: 10),
          SizedBox(
            height: 90,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                // Ekle butonu
                if (_photos.length < _maxPhotos)
                  GestureDetector(
                    onTap: _showPhotoOptions,
                    child: Container(
                      width: 90, height: 90,
                      margin: const EdgeInsets.only(right: 10),
                      decoration: BoxDecoration(
                        color: EVColors.primaryLight,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: EVColors.primary.withValues(alpha: 0.4),
                          width: 1.5,
                          strokeAlign: BorderSide.strokeAlignInside,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate_rounded,
                              size: 28, color: EVColors.primary),
                          const SizedBox(height: 4),
                          const Text('Fotoğraf Ekle',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 10, fontWeight: FontWeight.w600,
                              color: EVColors.primary,
                            )),
                        ],
                      ),
                    ),
                  ),
                // Eklenen fotoğraflar
                ..._photos.asMap().entries.map((e) {
                  final idx = e.key;
                  final file = e.value;
                  return Stack(
                    children: [
                      Container(
                        width: 90, height: 90,
                        margin: const EdgeInsets.only(right: 10),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: EVColors.border),
                          image: DecorationImage(
                            image: FileImage(file),
                            fit: BoxFit.cover,
                          ),
                        ),
                        // Kapak fotoğrafı etiketi
                        child: idx == 0
                          ? Align(
                              alignment: Alignment.bottomCenter,
                              child: Container(
                                width: double.infinity,
                                padding: const EdgeInsets.symmetric(vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.55),
                                  borderRadius: const BorderRadius.vertical(
                                      bottom: Radius.circular(13)),
                                ),
                                child: const Text('Kapak', textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white)),
                              ),
                            )
                          : null,
                      ),
                      // Sil butonu
                      Positioned(
                        top: 4, right: 14,
                        child: GestureDetector(
                          onTap: () => setState(() => _photos.removeAt(idx)),
                          child: Container(
                            width: 22, height: 22,
                            decoration: const BoxDecoration(
                              color: Color(0xFFD94F3D),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.close_rounded,
                                size: 13, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 4),
          const Text('İlk fotoğraf kapak olarak gösterilir.',
            style: TextStyle(fontSize: 11, color: EVColors.textHint)),
          const SizedBox(height: 20),

          _field('Marka', _brandCtrl, 'ör. Tesla'),
          _field('Model', _modelCtrl, 'ör. Model Y Long Range'),
          _field('Fiyat (₺)', _priceCtrl, 'ör. 2.850.000',
              type: TextInputType.number),
          _field('Kilometre', _kmCtrl, 'ör. 18500',
              type: TextInputType.number),
          _field('Şehir', _locationCtrl, 'ör. İstanbul'),
          const SizedBox(height: 4),
          const Text('Kimden', style: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w600,
            color: EVColors.textSecondary,
          )),
          const SizedBox(height: 8),
          _ChipGroup(
            options: const ['Sahibinden', 'Galeriden'],
            selected: _sellerType,
            onChanged: (v) => setState(() => _sellerType = v),
          ),
          const SizedBox(height: 14),
          const Text('Hasar Durumu', style: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w600,
            color: EVColors.textSecondary,
          )),
          const SizedBox(height: 8),
          _ChipGroup(
            options: const ['Kazasız', 'Kazalı'],
            selected: _damageStatus,
            colors: const {
              'Kazasız': EVColors.primary,
              'Kazalı': Color(0xFFD94F3D),
            },
            onChanged: (v) => setState(() => _damageStatus = v),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: GestureDetector(
              onTap: () => Navigator.pop(
                context,
                _photos.map((f) => f.path).toList(),
              ),
              child: Container(
                height: 52,
                decoration: BoxDecoration(
                  color: EVColors.primary,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [BoxShadow(
                    color: EVColors.primary.withValues(alpha: 0.35),
                    blurRadius: 12, offset: const Offset(0, 4),
                  )],
                ),
                child: const Center(child: Text('İlanı Yayınla',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700,
                      color: Colors.white))),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _field(String label, TextEditingController ctrl, String hint,
      {TextInputType type = TextInputType.text}) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(
        fontSize: 12, fontWeight: FontWeight.w600,
        color: EVColors.textSecondary,
      )),
      const SizedBox(height: 6),
      Container(
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: EVColors.border),
        ),
        child: TextField(
          controller: ctrl, keyboardType: type,
          style: const TextStyle(fontSize: 14, color: EVColors.textPrimary),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: EVColors.textHint, fontSize: 14),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.all(14),
          ),
        ),
      ),
      const SizedBox(height: 12),
    ]);
  }
}

// ─────────────────────────────────────────────
//  CHIP GROUP
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  SORT GROUP
// ─────────────────────────────────────────────
class _SortGroup extends StatelessWidget {
  final DateSort  dateSort;
  final PriceSort priceSort;
  final ValueChanged<DateSort>  onDateChanged;
  final ValueChanged<PriceSort> onPriceChanged;

  const _SortGroup({
    required this.dateSort,
    required this.priceSort,
    required this.onDateChanged,
    required this.onPriceChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _rowLabel('Tarihe Göre'),
        const SizedBox(height: 6),
        Row(children: [
          _dateChip(DateSort.newest, 'En Yeni',  Icons.north_rounded),
          const SizedBox(width: 8),
          _dateChip(DateSort.oldest, 'En Eski',  Icons.south_rounded),
        ]),
        const SizedBox(height: 10),
        _rowLabel('Fiyata Göre'),
        const SizedBox(height: 6),
        Row(children: [
          _priceChip(PriceSort.highest, 'En Yüksek', Icons.trending_up_rounded),
          const SizedBox(width: 8),
          _priceChip(PriceSort.lowest,  'En Düşük',  Icons.trending_down_rounded),
        ]),
      ],
    );
  }

  Widget _rowLabel(String t) => Text(t, style: const TextStyle(
    fontSize: 12, fontWeight: FontWeight.w600, color: EVColors.textHint,
  ));

  Widget _dateChip(DateSort sort, String label, IconData icon) {
    final active = dateSort == sort;
    return Expanded(
      child: GestureDetector(
        onTap: () => onDateChanged(active ? DateSort.none : sort),
        child: _chipContainer(active: active, icon: icon, label: label),
      ),
    );
  }

  Widget _priceChip(PriceSort sort, String label, IconData icon) {
    final active = priceSort == sort;
    return Expanded(
      child: GestureDetector(
        onTap: () => onPriceChanged(active ? PriceSort.none : sort),
        child: _chipContainer(active: active, icon: icon, label: label),
      ),
    );
  }

  Widget _chipContainer({required bool active, required IconData icon, required String label}) =>
    AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: active ? EVColors.primary.withValues(alpha: 0.12) : EVColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: active ? EVColors.primary : EVColors.border,
          width: active ? 1.5 : 1,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 15,
              color: active ? EVColors.primary : EVColors.textSecondary),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(
            fontSize: 12, fontWeight: FontWeight.w600,
            color: active ? EVColors.primary : EVColors.textSecondary,
          )),
        ],
      ),
    );
}

class _ChipGroup extends StatelessWidget {
  final List<String> options;
  final String selected;
  final ValueChanged<String> onChanged;
  final Map<String, Color> colors;
  const _ChipGroup({required this.options, required this.selected,
    required this.onChanged, this.colors = const {}});

  @override
  Widget build(BuildContext context) => Wrap(
    spacing: 8,
    children: options.map((o) {
      final active = o == selected;
      final color  = colors[o] ?? EVColors.primary;
      return GestureDetector(
        onTap: () => onChanged(o),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: active ? color.withValues(alpha: 0.12) : EVColors.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: active ? color : EVColors.border,
              width: active ? 1.5 : 1,
            ),
          ),
          child: Text(o, style: TextStyle(
            fontSize: 13, fontWeight: FontWeight.w600,
            color: active ? color : EVColors.textSecondary,
          )),
        ),
      );
    }).toList(),
  );
}

// ─────────────────────────────────────────────
//  İLAN VER FAB
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
//  MESAJ YAZMA SHEET
// ─────────────────────────────────────────────
class _MessageComposeSheet extends StatefulWidget {
  final EvListing listing;
  const _MessageComposeSheet({required this.listing});
  @override
  State<_MessageComposeSheet> createState() => _MessageComposeSheetState();
}

class _MessageComposeSheetState extends State<_MessageComposeSheet> {
  final _ctrl = TextEditingController();
  bool _sent = false;

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  void _send() {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    HapticFeedback.mediumImpact();
    MessageStore.instance.sendMessage(
      listingId: widget.listing.id,
      listingTitle: '${widget.listing.year} ${widget.listing.model}',
      sellerName: widget.listing.sellerName,
      sellerInitials: widget.listing.sellerInitials,
      sellerColor: widget.listing.sellerColor,
      text: text,
    );
    setState(() => _sent = true);
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (mounted) Navigator.pop(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    final l = widget.listing;
    return Container(
      padding: EdgeInsets.fromLTRB(20, 0, 20, bottom + 28),
      decoration: const BoxDecoration(
        color: EVColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Center(child: Padding(
          padding: const EdgeInsets.only(top: 14, bottom: 10),
          child: Container(width: 36, height: 4,
            decoration: BoxDecoration(
              color: EVColors.textHint.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        )),
        const SizedBox(height: 6),
        // Satıcı bilgisi
        Row(children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: l.sellerColor.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Center(child: Text(l.sellerInitials, style: TextStyle(
              fontSize: 16, fontWeight: FontWeight.w700, color: l.sellerColor,
            ))),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(l.sellerName, style: const TextStyle(
              fontSize: 14, fontWeight: FontWeight.w700, color: EVColors.textPrimary,
            )),
            Text('${l.year} ${l.model}', style: const TextStyle(
              fontSize: 12, color: EVColors.textSecondary,
            )),
          ])),
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 32, height: 32,
              decoration: BoxDecoration(color: EVColors.divider, shape: BoxShape.circle),
              child: const Icon(Icons.close_rounded, size: 16, color: EVColors.textSecondary),
            ),
          ),
        ]),
        const SizedBox(height: 16),
        // Hazır mesaj önerileri
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: [
            _QuickReply('Hâlâ satılık mı?', _ctrl),
            _QuickReply('Takas düşünür müsünüz?', _ctrl),
            _QuickReply('Fiyat pazarlık payı var mı?', _ctrl),
            _QuickReply('Ne zaman görüşebiliriz?', _ctrl),
          ]),
        ),
        const SizedBox(height: 12),
        // Mesaj alanı
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 300),
          child: _sent
            ? Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Container(
                    width: 36, height: 36,
                    decoration: const BoxDecoration(
                      color: EVColors.primaryLight, shape: BoxShape.circle),
                    child: const Icon(Icons.check_rounded,
                        size: 20, color: EVColors.primary),
                  ),
                  const SizedBox(width: 10),
                  const Text('Mesajın gönderildi!', style: TextStyle(
                    fontSize: 14, fontWeight: FontWeight.w700,
                    color: EVColors.textPrimary,
                  )),
                ]),
              )
            : Row(children: [
                Expanded(
                  child: Container(
                    constraints: const BoxConstraints(maxHeight: 120),
                    decoration: BoxDecoration(
                      color: EVColors.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: EVColors.border),
                    ),
                    child: TextField(
                      controller: _ctrl,
                      maxLines: null,
                      autofocus: true,
                      style: const TextStyle(fontSize: 14, color: EVColors.textPrimary),
                      decoration: const InputDecoration(
                        hintText: 'Satıcıya mesaj yaz…',
                        hintStyle: TextStyle(color: EVColors.textHint, fontSize: 14),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(
                            horizontal: 14, vertical: 12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                GestureDetector(
                  onTap: _send,
                  child: Container(
                    width: 46, height: 46,
                    decoration: BoxDecoration(
                      color: EVColors.primary,
                      shape: BoxShape.circle,
                      boxShadow: [BoxShadow(
                        color: EVColors.primary.withValues(alpha: 0.35),
                        blurRadius: 10, offset: const Offset(0, 4),
                      )],
                    ),
                    child: const Icon(Icons.send_rounded,
                        color: Colors.white, size: 18),
                  ),
                ),
              ]),
        ),
      ]),
    );
  }
}

class _QuickReply extends StatelessWidget {
  final String text;
  final TextEditingController ctrl;
  const _QuickReply(this.text, this.ctrl);

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () => ctrl.text = text,
    child: Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: EVColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: EVColors.border),
      ),
      child: Text(text, style: const TextStyle(
        fontSize: 12, fontWeight: FontWeight.w500, color: EVColors.textSecondary,
      )),
    ),
  );
}

// ─────────────────────────────────────────────
//  İLAN VER FAB
// ─────────────────────────────────────────────
class _IlanVerFab extends StatelessWidget {
  final VoidCallback onTap;
  const _IlanVerFab({required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 18),
      decoration: BoxDecoration(
        color: EVColors.primary,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [BoxShadow(
          color: EVColors.primary.withValues(alpha: 0.4),
          blurRadius: 14, offset: const Offset(0, 5),
        )],
      ),
      child: const Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.add_rounded, color: Colors.white, size: 18),
        SizedBox(width: 5),
        Text('İlan Ver', style: TextStyle(
          fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white,
        )),
      ]),
    ),
  );
}

// ─────────────────────────────────────────────
//  FULL-SCREEN PHOTO VIEWER
// ─────────────────────────────────────────────
class _PhotoViewerScreen extends StatefulWidget {
  final List<String> photos;
  final int initialIndex;
  const _PhotoViewerScreen({required this.photos, required this.initialIndex});

  @override
  State<_PhotoViewerScreen> createState() => _PhotoViewerScreenState();
}

class _PhotoViewerScreenState extends State<_PhotoViewerScreen>
    with SingleTickerProviderStateMixin {
  late final PageController _pageCtrl;
  late int _current;
  late final List<TransformationController> _transformCtrls;
  late final AnimationController _bgAnim;
  late final Animation<Color?> _bgColor;

  @override
  void initState() {
    super.initState();
    _current = widget.initialIndex;
    _pageCtrl = PageController(initialPage: widget.initialIndex);
    _transformCtrls = List.generate(
        widget.photos.length, (_) => TransformationController());

    _bgAnim = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 220), value: 1.0);
    _bgColor = ColorTween(
      begin: Colors.transparent,
      end: Colors.black,
    ).animate(_bgAnim);
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    for (final c in _transformCtrls) {
      c.dispose();
    }
    _bgAnim.dispose();
    super.dispose();
  }

  bool _isZoomed(int index) {
    return _transformCtrls[index].value != Matrix4.identity();
  }

  void _resetZoom(int index) {
    _transformCtrls[index].value = Matrix4.identity();
  }

  void _handleTap(int index) {
    if (_isZoomed(index)) {
      _resetZoom(index);
    } else {
      _close();
    }
  }

  void _close() {
    _bgAnim.reverse().then((_) {
      if (mounted) Navigator.of(context).pop();
    });
  }

  Widget _buildImage(String src) {
    if (src.startsWith('http')) {
      return Image.network(
        src,
        fit: BoxFit.contain,
        loadingBuilder: (_, child, progress) => progress == null
            ? child
            : const Center(
                child: CircularProgressIndicator(
                    strokeWidth: 2, color: Colors.white)),
      );
    }
    return Image.file(File(src), fit: BoxFit.contain);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _bgColor,
      builder: (_, __) => Scaffold(
        backgroundColor: _bgColor.value,
        body: Stack(
          children: [
            // ── Photos ───────────────────────────────
            PageView.builder(
              controller: _pageCtrl,
              itemCount: widget.photos.length,
              onPageChanged: (i) {
                _resetZoom(_current);
                setState(() => _current = i);
              },
              itemBuilder: (_, i) {
                final ctrl = _transformCtrls[i];
                return GestureDetector(
                  onTap: () => _handleTap(i),
                  child: InteractiveViewer(
                    transformationController: ctrl,
                    minScale: 1.0,
                    maxScale: 4.0,
                    clipBehavior: Clip.none,
                    child: Center(child: _buildImage(widget.photos[i])),
                  ),
                );
              },
            ),

            // ── Close button ─────────────────────────
            SafeArea(
              child: Align(
                alignment: Alignment.topRight,
                child: GestureDetector(
                  onTap: _close,
                  child: Container(
                    margin: const EdgeInsets.all(12),
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close_rounded,
                        color: Colors.white, size: 18),
                  ),
                ),
              ),
            ),

            // ── Dot indicators ───────────────────────
            if (widget.photos.length > 1)
              Positioned(
                bottom: 32, left: 0, right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(widget.photos.length, (i) =>
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      width: _current == i ? 18 : 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: _current == i
                            ? Colors.white
                            : Colors.white.withValues(alpha: 0.45),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    )),
                ),
              ),

            // ── Counter ──────────────────────────────
            if (widget.photos.length > 1)
              SafeArea(
                child: Align(
                  alignment: Alignment.topLeft,
                  child: Container(
                    margin: const EdgeInsets.all(12),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${_current + 1}/${widget.photos.length}',
                      style: const TextStyle(
                        color: Colors.white, fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
