import 'dart:io';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter/services.dart';

// ─────────────────────────────────────────────
//  COLORS  (keep in shared theme.dart in prod)
// ─────────────────────────────────────────────
class EVColors {
  EVColors._();
  static const Color primary       = Color(0xFF2DC653);
  static const Color primaryLight  = Color(0xFFE8F9ED);
  static const Color primaryMid    = Color(0xFFB6EFC5);
  static const Color onPrimary     = Color(0xFFFFFFFF);
  static const Color surface       = Color(0xFFFFFFFF);
  static const Color background    = Color(0xFFF6FBF7);
  static const Color textPrimary   = Color(0xFF0D1B12);
  static const Color textSecondary = Color(0xFF5A7264);
  static const Color textHint      = Color(0xFFADC4B4);
  static const Color border        = Color(0xFFD4EBD9);
  static const Color divider       = Color(0xFFE8F2EA);
  static const Color error         = Color(0xFFD94F3D);
}

// ─────────────────────────────────────────────
//  MOCK DATA  — EV models & locations
// ─────────────────────────────────────────────
const List<String> kEvModels = [
  'Tesla Model Y',
  'Tesla Model 3',
  'Tesla Model S',
  'Hyundai IONIQ 6',
  'Hyundai IONIQ 5',
  'BMW iX',
  'BMW i4',
  'Porsche Taycan',
  'Audi e-tron GT',
  'Volkswagen ID.4',
  'Renault Megane E-Tech',
  'Kia EV6',
  'Kia EV9',
  'Mercedes EQS',
  'Volvo XC40 Recharge',
  'Togg T10X',
  'Togg T10F',
  'Rivian R1T',
  'Lucid Air',
  'Polestar 2',
];

const List<String> kLocations = [
  'Supercharger · Istanbul, TR',
  'Supercharger · Ankara, TR',
  'Supercharger · İzmir, TR',
  'Electrify America · Ankara, TR',
  'Shell Recharge · İzmir, TR',
  'Togg HızlıŞarj · Bursa, TR',
  'BP Pulse · İstanbul, TR',
  'EVBox · İstanbul, TR',
  'ZES · Ankara, TR',
  'Aksaray Supercharger, TR',
  'Highway Charger A1 · Berlin, DE',
  'Ionity · Munich, DE',
  'Fastned · Amsterdam, NL',
  'Pod Point · London, UK',
];

// Placeholder gradient "photos" — swapped when user picks a real image
final List<_MockPhoto> kMockPhotos = [
  _MockPhoto([Color(0xFF0D3B1F), Color(0xFF1A7A40), Color(0xFF2DC653)], '⚡'),
  _MockPhoto([Color(0xFF0A1E3C), Color(0xFF1A4A8C), Color(0xFF378ADD)], '🌊'),
  _MockPhoto([Color(0xFF3B1F00), Color(0xFF9B5800), Color(0xFFEF9F27)], '🌅'),
  _MockPhoto([Color(0xFF1A1060), Color(0xFF3D35A0), Color(0xFF7F77DD)], '🏙'),
  _MockPhoto([Color(0xFF003830), Color(0xFF006655), Color(0xFF00C49A)], '🌿'),
  _MockPhoto([Color(0xFF4A0A25), Color(0xFF8C1A45), Color(0xFFD4537E)], '💙'),
];

class _MockPhoto {
  final List<Color> gradient;
  final String emoji;
  const _MockPhoto(this.gradient, this.emoji);
}

// ─────────────────────────────────────────────
//  CREATE STORY SCREEN
// ─────────────────────────────────────────────
class CreateStoryScreen extends StatefulWidget {
  const CreateStoryScreen({super.key});

  @override
  State<CreateStoryScreen> createState() => _CreateStoryScreenState();
}

class _CreateStoryScreenState extends State<CreateStoryScreen>
    with TickerProviderStateMixin {
  // ── State ──────────────────────────────────
  _MockPhoto? _selectedPhoto;
  final ImagePicker _picker = ImagePicker();
File? _selectedImage;
Future<void> _pickImageFromGallery() async {
  final XFile? pickedFile = await _picker.pickImage(
    source: ImageSource.gallery,
  );

  if (pickedFile != null) {
    setState(() {
      _selectedImage = File(pickedFile.path);
    });
    if (mounted) Navigator.pop(context);
  }
}
  final _captionCtrl   = TextEditingController();
  final _evModelCtrl   = TextEditingController();
  final _locationCtrl  = TextEditingController();
  final _scrollCtrl    = ScrollController();

  bool _isPosting    = false;
  bool _captionFocus = false;

  late AnimationController _previewAnim;
  late Animation<double>   _previewScale;
  late AnimationController _btnAnim;
  late Animation<double>   _btnScale;

  final FocusNode _captionFocus_ = FocusNode();

  @override
  void initState() {
    super.initState();

    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ));

    _previewAnim = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 400));
    _previewScale = Tween(begin: 0.92, end: 1.0).animate(
        CurvedAnimation(parent: _previewAnim, curve: Curves.easeOutBack));

    _btnAnim = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 100));
    _btnScale = Tween(begin: 1.0, end: 0.96).animate(
        CurvedAnimation(parent: _btnAnim, curve: Curves.easeOut));

    _captionFocus_.addListener(() {
      setState(() => _captionFocus = _captionFocus_.hasFocus);
    });
  }

  @override
  void dispose() {
    _captionCtrl.dispose();
    _evModelCtrl.dispose();
    _locationCtrl.dispose();
    _scrollCtrl.dispose();
    _previewAnim.dispose();
    _btnAnim.dispose();
    _captionFocus_.dispose();
    super.dispose();
  }

  // ── Choose mock photo ─────────────────────
  void _choosePhoto() {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _PhotoPickerSheet(
        onSelected: (photo) {
          setState(() => _selectedPhoto = photo);
          _previewAnim.forward(from: 0);
        },
        onChoose: _pickImageFromGallery,
      ),
    );
  }

  // ── Remove photo ──────────────────────────
  void _removePhoto() {
    HapticFeedback.lightImpact();
    setState(() => _selectedPhoto = null);
    _previewAnim.reset();
  }

  // ── Pick EV model ─────────────────────────
  void _pickEvModel() {
    FocusScope.of(context).unfocus();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _SearchablePickerSheet(
        title: 'Select EV Model',
        items: kEvModels,
        onSelected: (v) => setState(() => _evModelCtrl.text = v),
      ),
    );
  }

  // ── Pick location ─────────────────────────
  void _pickLocation() {
    FocusScope.of(context).unfocus();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _SearchablePickerSheet(
        title: 'Select Charging Station',
        items: kLocations,
        onSelected: (v) => setState(() => _locationCtrl.text = v),
      ),
    );
  }

  // ── Share story ───────────────────────────
  Future<void> _shareStory() async {
  final hasPhoto = _selectedImage != null || _selectedPhoto != null;
  if (!hasPhoto) {
    _showSnack('Lütfen önce bir fotoğraf seç', isError: true);
    return;
  }

  HapticFeedback.mediumImpact();
  await _btnAnim.forward();
  await _btnAnim.reverse();

  setState(() => _isPosting = true);

  if (_selectedImage != null) {
    print('Story shared: ${_selectedImage!.path}');
  } else {
    print('Story shared: mock photo (${_selectedPhoto?.emoji})');
  }
  print('Caption: ${_captionCtrl.text}');
  print('EV Model: ${_evModelCtrl.text}');
  print('Location: ${_locationCtrl.text}');

  await Future.delayed(const Duration(milliseconds: 1500));
  if (!mounted) return;

  setState(() => _isPosting = false);
  HapticFeedback.heavyImpact();
  _showSnack('Hikaye paylaşıldı! ⚡', isError: false);
  await Future.delayed(const Duration(milliseconds: 600));
  if (mounted) Navigator.of(context).pop();
}

  void _showSnack(String msg, {required bool isError}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg, style: const TextStyle(
        fontWeight: FontWeight.w600, fontSize: 13)),
      backgroundColor: isError ? EVColors.error : EVColors.primary,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.all(16),
      duration: const Duration(seconds: 2),
    ));
  }

  bool get _hasContent =>
      _selectedImage != null || _selectedPhoto != null;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Scaffold(
      backgroundColor: EVColors.background,
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: Column(
          children: [
            // ── Top bar ────────────────────────────
            _TopBar(onClose: () => Navigator.of(context).maybePop()),

            // ── Scrollable content ─────────────────
            Expanded(
              child: SingleChildScrollView(
                controller: _scrollCtrl,
                padding: EdgeInsets.only(bottom: bottom + 16),
                physics: const BouncingScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 8),

                      // ── Preview area ──────────────────
                      _PreviewArea(
  photo: _selectedPhoto,
  selectedImage: _selectedImage,
  scaleAnim: _previewScale,
  onChoose: _choosePhoto,
  onRemove: _removePhoto,
  caption: _captionCtrl.text,
  evModel: _evModelCtrl.text,
  location: _locationCtrl.text,
),

                      const SizedBox(height: 20),

                      // ── Photo strip / gallery hint ────
                      if (_selectedPhoto == null)
                        _PhotoStrip(onSelected: (p) {
                          setState(() => _selectedPhoto = p);
                          _previewAnim.forward(from: 0);
                        }),

                      if (_selectedPhoto == null) const SizedBox(height: 20),

                      // ── Caption field ─────────────────
                      _SectionLabel(label: 'Caption', icon: Icons.notes_rounded),
                      const SizedBox(height: 8),
                      _CaptionField(
                        controller: _captionCtrl,
                        focusNode: _captionFocus_,
                        onChanged: (_) => setState(() {}),
                      ),

                      const SizedBox(height: 20),

                      // ── EV Info ───────────────────────
                      _SectionLabel(
                          label: 'EV Info',
                          icon: Icons.electric_bolt_rounded,
                          subtitle: 'Optional — helps others find your content'),
                      const SizedBox(height: 10),

                      // EV Model picker
                      _PickerField(
                        controller: _evModelCtrl,
                        hint: 'Select your EV model',
                        icon: Icons.directions_car_rounded,
                        onTap: _pickEvModel,
                        onClear: () => setState(() => _evModelCtrl.clear()),
                      ),

                      const SizedBox(height: 10),

                      // Location picker
                      _PickerField(
                        controller: _locationCtrl,
                        hint: 'Add charging station / location',
                        icon: Icons.location_on_rounded,
                        iconColor: const Color(0xFFD4537E),
                        onTap: _pickLocation,
                        onClear: () => setState(() => _locationCtrl.clear()),
                      ),

                      const SizedBox(height: 28),

                      // ── Audience chips ────────────────
                      _AudienceRow(),

                      const SizedBox(height: 28),

                      // ── Share button ──────────────────
                      _ShareButton(
                        scaleAnim: _btnScale,
                        isLoading: _isPosting,
                        isEnabled: _hasContent,
                        onTap: _shareStory,
                      ),

                      const SizedBox(height: 20),
                    ],
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

// ─────────────────────────────────────────────
//  TOP BAR
// ─────────────────────────────────────────────
class _TopBar extends StatelessWidget {
  final VoidCallback onClose;
  const _TopBar({required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.close_rounded,
                color: EVColors.textPrimary, size: 22),
            onPressed: onClose,
          ),
          const Spacer(),
          RichText(
            text: const TextSpan(children: [
              TextSpan(text: 'New ', style: TextStyle(
                fontSize: 17, fontWeight: FontWeight.w700,
                color: EVColors.textPrimary, letterSpacing: -0.3,
              )),
              TextSpan(text: 'Akım', style: TextStyle(
                fontSize: 17, fontWeight: FontWeight.w700,
                color: EVColors.primary, letterSpacing: -0.3,
              )),
            ]),
          ),
          const Spacer(),
          // Draft save button
          GestureDetector(
            onTap: () {},
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(
                color: EVColors.primaryLight,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: EVColors.primaryMid),
              ),
              child: const Text('Save draft', style: TextStyle(
                fontSize: 12, fontWeight: FontWeight.w600,
                color: EVColors.primary,
              )),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  PREVIEW AREA
// ─────────────────────────────────────────────
class _PreviewArea extends StatelessWidget {
  final _MockPhoto? photo;
  final File? selectedImage;
  final Animation<double> scaleAnim;
  final VoidCallback onChoose;
  final VoidCallback onRemove;
  final String caption, evModel, location;

  const _PreviewArea({
    super.key,
    required this.photo,
    required this.selectedImage,
    required this.scaleAnim,
    required this.onChoose,
    required this.onRemove,
    required this.caption,
    required this.evModel,
    required this.location,
  });

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 9 / 14,
      child: photo == null
          ? _EmptyPreview(
  onChoose: onChoose,
  selectedImage: selectedImage,
)
          : _FilledPreview(
              photo: photo!,
              scaleAnim: scaleAnim,
              onRemove: onRemove,
              onChoose: onChoose,
              caption: caption,
              evModel: evModel,
              location: location,
            ),
    );
  }
}

class _EmptyPreview extends StatefulWidget {
  final VoidCallback onChoose;
  final File? selectedImage;
  const _EmptyPreview({
  required this.onChoose,
  required this.selectedImage,
});

  @override
  State<_EmptyPreview> createState() => _EmptyPreviewState();
}

class _EmptyPreviewState extends State<_EmptyPreview>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulse;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 1600))
      ..repeat(reverse: true);
    _pulseAnim = Tween(begin: 0.95, end: 1.05).animate(
        CurvedAnimation(parent: _pulse, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
    onTap: widget.onChoose,
      child: widget.selectedImage != null
    ? ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Image.file(
          widget.selectedImage!,
          width: double.infinity,
          height: double.infinity,
          fit: BoxFit.cover,
        ),
      )
    : Container(
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: EVColors.primaryMid,
            width: 1.5,
            strokeAlign: BorderSide.strokeAlignInside,
          ),
          boxShadow: [
            BoxShadow(
              color: EVColors.primary.withOpacity(0.06),
              blurRadius: 20, offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Subtle grid pattern
            CustomPaint(
              painter: _DotGridPainter(),
              child: const SizedBox.expand(),
            ),
            // Center prompt
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ScaleTransition(
                    scale: _pulseAnim,
                    child: Container(
                      width: 72, height: 72,
                      decoration: BoxDecoration(
                        color: EVColors.primaryLight,
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: EVColors.primaryMid, width: 1.5),
                      ),
                      child: const Icon(Icons.add_photo_alternate_rounded,
                          color: EVColors.primary, size: 32),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text('Tap to choose a photo', style: TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w600,
                    color: EVColors.textSecondary,
                  )),
                  const SizedBox(height: 6),
                  const Text('JPG, PNG · Max 20 MB', style: TextStyle(
                    fontSize: 12, color: EVColors.textHint,
                  )),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilledPreview extends StatelessWidget {
  final _MockPhoto photo;
  final Animation<double> scaleAnim;
  final VoidCallback onRemove, onChoose;
  final String caption, evModel, location;

  const _FilledPreview({
    required this.photo,
    required this.scaleAnim,
    required this.onRemove,
    required this.onChoose,
    required this.caption,
    required this.evModel,
    required this.location,
  });

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: scaleAnim,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Gradient background
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: photo.gradient,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),

            // Decorative circles
            Positioned(top: -60, right: -60,
              child: Container(width: 220, height: 220,
                decoration: BoxDecoration(shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.05)))),
            Positioned(bottom: 60, left: -80,
              child: Container(width: 280, height: 280,
                decoration: BoxDecoration(shape: BoxShape.circle,
                  color: Colors.white.withOpacity(0.04)))),

            // Hero emoji
            Center(child: Text(photo.emoji,
                style: const TextStyle(fontSize: 100))),

            // Bottom gradient for legibility
            Positioned(bottom: 0, left: 0, right: 0,
              child: Container(
                height: 180,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      Colors.black.withOpacity(0.70),
                      Colors.transparent,
                    ],
                  ),
                ),
              )),

            // Overlay: EV model + location
            if (evModel.isNotEmpty || location.isNotEmpty)
              Positioned(
                bottom: 16, left: 16, right: 60,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (evModel.isNotEmpty)
                      _OverlayChip(emoji: '⚡', label: evModel, isAccent: true),
                    if (evModel.isNotEmpty && location.isNotEmpty)
                      const SizedBox(height: 6),
                    if (location.isNotEmpty)
                      _OverlayChip(emoji: '📍', label: location, isAccent: false),
                  ],
                ),
              ),

            // Caption preview
            if (caption.isNotEmpty)
              Positioned(
                bottom: evModel.isNotEmpty || location.isNotEmpty ? 90 : 16,
                left: 16, right: 16,
                child: Text(caption,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.90),
                    height: 1.45,
                    shadows: [Shadow(
                        color: Colors.black.withOpacity(0.5), blurRadius: 6)],
                  )),
              ),

            // Top-right controls
            Positioned(
              top: 12, right: 12,
              child: Column(
                children: [
                  _PreviewIconBtn(
                    icon: Icons.close_rounded,
                    onTap: onRemove,
                  ),
                  const SizedBox(height: 8),
                  _PreviewIconBtn(
                    icon: Icons.swap_horiz_rounded,
                    onTap: onChoose,
                  ),
                ],
              ),
            ),

            // Aspect ratio label
            Positioned(
              top: 12, left: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.35),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text('9:14', style: TextStyle(
                  fontSize: 10, color: Colors.white,
                  fontWeight: FontWeight.w600,
                )),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PreviewIconBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _PreviewIconBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34, height: 34,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.40),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white.withOpacity(0.20)),
        ),
        child: Icon(icon, color: Colors.white, size: 17),
      ),
    );
  }
}

class _OverlayChip extends StatelessWidget {
  final String emoji, label;
  final bool isAccent;
  const _OverlayChip({
    required this.emoji,
    required this.label,
    required this.isAccent,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isAccent
            ? const Color(0xFF2DC653).withOpacity(0.22)
            : Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isAccent
              ? const Color(0xFF2DC653).withOpacity(0.45)
              : Colors.white.withOpacity(0.25),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 11)),
          const SizedBox(width: 5),
          Flexible(
            child: Text(label,
              maxLines: 1, overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 11, fontWeight: FontWeight.w600,
                color: isAccent
                    ? const Color(0xFF2DC653)
                    : Colors.white.withOpacity(0.92),
              )),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  PHOTO STRIP  (quick-pick thumbnails)
// ─────────────────────────────────────────────
class _PhotoStrip extends StatelessWidget {
  final ValueChanged<_MockPhoto> onSelected;
  const _PhotoStrip({required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(
            children: const [
              Icon(Icons.grid_view_rounded,
                  size: 14, color: EVColors.textHint),
              SizedBox(width: 6),
              Text('Quick select', style: TextStyle(
                fontSize: 12, color: EVColors.textHint,
                fontWeight: FontWeight.w500,
              )),
            ],
          ),
        ),
        SizedBox(
          height: 72,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: kMockPhotos.length,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final p = kMockPhotos[i];
              return GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  onSelected(p);
                },
                child: Container(
                  width: 72,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    gradient: LinearGradient(
                      colors: p.gradient,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Center(
                    child: Text(p.emoji,
                        style: const TextStyle(fontSize: 28)),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────
//  SECTION LABEL
// ─────────────────────────────────────────────
class _SectionLabel extends StatelessWidget {
  final String label;
  final IconData icon;
  final String? subtitle;

  const _SectionLabel({
    required this.label,
    required this.icon,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 28, height: 28,
          decoration: BoxDecoration(
            color: EVColors.primaryLight,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 14, color: EVColors.primary),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(
              fontSize: 14, fontWeight: FontWeight.w700,
              color: EVColors.textPrimary, letterSpacing: -0.2,
            )),
            if (subtitle != null)
              Text(subtitle!, style: const TextStyle(
                fontSize: 11, color: EVColors.textHint,
              )),
          ],
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────
//  CAPTION FIELD
// ─────────────────────────────────────────────
class _CaptionField extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;

  const _CaptionField({
    required this.controller,
    required this.focusNode,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: focusNode,
      builder: (_, __) {
        final focused = focusNode.hasFocus;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: EVColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: focused ? EVColors.primary : EVColors.border,
              width: focused ? 1.5 : 1.0,
            ),
            boxShadow: focused
                ? [BoxShadow(
                    color: EVColors.primary.withOpacity(0.10),
                    blurRadius: 12, offset: const Offset(0, 4))]
                : [],
          ),
          child: Column(
            children: [
              TextField(
                controller: controller,
                focusNode: focusNode,
                onChanged: onChanged,
                maxLines: 4,
                minLines: 3,
                maxLength: 220,
                style: const TextStyle(
                  fontSize: 14, color: EVColors.textPrimary, height: 1.5),
                decoration: const InputDecoration(
                  hintText: 'Write a caption… What\'s the story behind this moment?',
                  hintStyle: TextStyle(
                    color: EVColors.textHint, fontSize: 14, height: 1.5),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.all(14),
                  counterStyle: TextStyle(
                    fontSize: 11, color: EVColors.textHint),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────
//  PICKER FIELD
// ─────────────────────────────────────────────
class _PickerField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final Color? iconColor;
  final VoidCallback onTap;
  final VoidCallback onClear;

  const _PickerField({
    required this.controller,
    required this.hint,
    required this.icon,
    this.iconColor,
    required this.onTap,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final color = iconColor ?? EVColors.primary;
    final hasValue = controller.text.isNotEmpty;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        height: 52,
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: hasValue ? color.withOpacity(0.35) : EVColors.border,
          ),
        ),
        child: Row(
          children: [
            const SizedBox(width: 14),
            Container(
              width: 28, height: 28,
              decoration: BoxDecoration(
                color: color.withOpacity(0.10),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 15, color: color),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                controller.text.isEmpty ? hint : controller.text,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 14,
                  color: controller.text.isEmpty
                      ? EVColors.textHint
                      : EVColors.textPrimary,
                  fontWeight: controller.text.isEmpty
                      ? FontWeight.w400
                      : FontWeight.w500,
                ),
              ),
            ),
            if (hasValue)
              GestureDetector(
                onTap: onClear,
                child: Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Container(
                    width: 22, height: 22,
                    decoration: BoxDecoration(
                      color: EVColors.textHint.withOpacity(0.20),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close_rounded,
                        size: 12, color: EVColors.textSecondary),
                  ),
                ),
              )
            else
              const Padding(
                padding: EdgeInsets.only(right: 14),
                child: Icon(Icons.keyboard_arrow_down_rounded,
                    color: EVColors.textHint, size: 18),
              ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  AUDIENCE ROW
// ─────────────────────────────────────────────
class _AudienceRow extends StatefulWidget {
  @override
  State<_AudienceRow> createState() => _AudienceRowState();
}

class _AudienceRowState extends State<_AudienceRow> {
  int _selected = 0;
  static const _options = [
    _AudienceOption(icon: Icons.public_rounded,       label: 'Everyone'),
    _AudienceOption(icon: Icons.people_rounded,       label: 'Followers'),
    _AudienceOption(icon: Icons.lock_outline_rounded, label: 'Only me'),
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionLabel(
            label: 'Audience',
            icon: Icons.visibility_rounded,
            subtitle: 'Who can see this story'),
        const SizedBox(height: 10),
        Row(
          children: List.generate(_options.length, (i) {
            final opt = _options[i];
            final active = i == _selected;
            return Expanded(
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.selectionClick();
                  setState(() => _selected = i);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 180),
                  margin: EdgeInsets.only(right: i < _options.length - 1 ? 8 : 0),
                  padding: const EdgeInsets.symmetric(vertical: 11),
                  decoration: BoxDecoration(
                    color: active ? EVColors.primary : EVColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: active ? EVColors.primary : EVColors.border,
                    ),
                    boxShadow: active
                        ? [BoxShadow(
                            color: EVColors.primary.withOpacity(0.25),
                            blurRadius: 10, offset: const Offset(0, 4))]
                        : [],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(opt.icon,
                          size: 18,
                          color: active
                              ? EVColors.onPrimary
                              : EVColors.textHint),
                      const SizedBox(height: 4),
                      Text(opt.label, style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: active
                            ? EVColors.onPrimary
                            : EVColors.textHint,
                      )),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }
}

class _AudienceOption {
  final IconData icon;
  final String label;
  const _AudienceOption({required this.icon, required this.label});
}

// ─────────────────────────────────────────────
//  SHARE BUTTON
// ─────────────────────────────────────────────
class _ShareButton extends StatelessWidget {
  final Animation<double> scaleAnim;
  final bool isLoading, isEnabled;
  final VoidCallback onTap;

  const _ShareButton({
    required this.scaleAnim,
    required this.isLoading,
    required this.isEnabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: scaleAnim,
      child: GestureDetector(
        onTap: isEnabled && !isLoading ? onTap : null,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          height: 56,
          decoration: BoxDecoration(
            color: isEnabled ? EVColors.primary : EVColors.primaryMid,
            borderRadius: BorderRadius.circular(16),
            boxShadow: isEnabled
                ? [BoxShadow(
                    color: EVColors.primary.withOpacity(0.35),
                    blurRadius: 20, offset: const Offset(0, 8))]
                : [],
          ),
          child: Center(
            child: isLoading
                ? const SizedBox(width: 22, height: 22,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: EVColors.onPrimary))
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.auto_awesome_rounded,
                        color: isEnabled
                            ? EVColors.onPrimary
                            : EVColors.textSecondary,
                        size: 17,
                      ),
                      const SizedBox(width: 8),
                      Text('Share Story', style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: isEnabled
                            ? EVColors.onPrimary
                            : EVColors.textSecondary,
                        letterSpacing: 0.2,
                      )),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.arrow_forward_rounded,
                        color: isEnabled
                            ? EVColors.onPrimary.withOpacity(0.7)
                            : EVColors.textHint,
                        size: 16,
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  PHOTO PICKER BOTTOM SHEET
// ─────────────────────────────────────────────
class _PhotoPickerSheet extends StatelessWidget {
  final ValueChanged<_MockPhoto> onSelected;
  final VoidCallback onChoose;
  const _PhotoPickerSheet({
  required this.onSelected,
  required this.onChoose,
});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: EVColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 8),
            child: Container(
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: EVColors.textHint.withOpacity(0.4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Row(
              children: const [
                Text('Choose Photo', style: TextStyle(
                  fontSize: 16, fontWeight: FontWeight.w700,
                  color: EVColors.textPrimary,
                )),
                Spacer(),
                Text('Mock gallery', style: TextStyle(
                  fontSize: 12, color: EVColors.textHint,
                )),
              ],
            ),
          ),
          const SizedBox(height: 14),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 1,
            ),
            itemCount: kMockPhotos.length,
            itemBuilder: (_, i) {
              final p = kMockPhotos[i];
              return GestureDetector(
                onTap: () {
                  Navigator.pop(context);
                  onSelected(p);
                  HapticFeedback.mediumImpact();
                },
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: p.gradient,
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Center(
                      child: Text(p.emoji,
                          style: const TextStyle(fontSize: 36)),
                    ),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
            child: _OutlineBtn(
              icon: Icons.photo_library_outlined,
              label: 'Open device gallery (not wired)',
              onTap: onChoose,
            ),
          ),
          SizedBox(
              height: MediaQuery.of(context).padding.bottom + 16),
        ],
      ),
    );
  }
}

class _OutlineBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _OutlineBtn({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: EVColors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: EVColors.textSecondary),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(
              fontSize: 13, fontWeight: FontWeight.w500,
              color: EVColors.textSecondary,
            )),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  SEARCHABLE PICKER SHEET  (EV model / location)
// ─────────────────────────────────────────────
class _SearchablePickerSheet extends StatefulWidget {
  final String title;
  final List<String> items;
  final ValueChanged<String> onSelected;

  const _SearchablePickerSheet({
    required this.title,
    required this.items,
    required this.onSelected,
  });

  @override
  State<_SearchablePickerSheet> createState() =>
      _SearchablePickerSheetState();
}

class _SearchablePickerSheetState extends State<_SearchablePickerSheet> {
  final _searchCtrl = TextEditingController();
  List<String> _filtered = [];

  @override
  void initState() {
    super.initState();
    _filtered = widget.items;
    _searchCtrl.addListener(() {
      final q = _searchCtrl.text.toLowerCase();
      setState(() => _filtered = widget.items
          .where((i) => i.toLowerCase().contains(q))
          .toList());
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      maxChildSize: 0.92,
      minChildSize: 0.4,
      builder: (_, ctrl) => Container(
        decoration: const BoxDecoration(
          color: EVColors.background,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Handle
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 4),
              child: Container(
                width: 36, height: 4,
                decoration: BoxDecoration(
                  color: EVColors.textHint.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
              child: Row(
                children: [
                  Text(widget.title, style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w700,
                    color: EVColors.textPrimary,
                  )),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 28, height: 28,
                      decoration: BoxDecoration(
                        color: EVColors.divider,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.close_rounded,
                          size: 14, color: EVColors.textSecondary),
                    ),
                  ),
                ],
              ),
            ),

            // Search field
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: EVColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: EVColors.border),
                ),
                child: Row(
                  children: [
                    const SizedBox(width: 12),
                    const Icon(Icons.search_rounded,
                        color: EVColors.textHint, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _searchCtrl,
                        decoration: const InputDecoration(
                          hintText: 'Search…',
                          hintStyle: TextStyle(
                            color: EVColors.textHint, fontSize: 13),
                          border: InputBorder.none,
                          isDense: true,
                        ),
                        style: const TextStyle(
                          fontSize: 13, color: EVColors.textPrimary),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const Divider(height: 1, color: EVColors.divider),

            // List
            Expanded(
              child: ListView.separated(
                controller: ctrl,
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 8),
                itemCount: _filtered.length,
                separatorBuilder: (_, __) =>
                    const Divider(height: 1, color: EVColors.divider),
                itemBuilder: (_, i) {
                  final item = _filtered[i];
                  return GestureDetector(
                    onTap: () {
                      Navigator.pop(context);
                      widget.onSelected(item);
                      HapticFeedback.selectionClick();
                    },
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      child: Row(
                        children: [
                          Text(item, style: const TextStyle(
                            fontSize: 14, color: EVColors.textPrimary,
                            fontWeight: FontWeight.w500,
                          )),
                          const Spacer(),
                          const Icon(Icons.chevron_right_rounded,
                              size: 16, color: EVColors.textHint),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  DOT GRID PAINTER  (empty preview background)
// ─────────────────────────────────────────────
class _DotGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = EVColors.primaryMid.withOpacity(0.4)
      ..style = PaintingStyle.fill;

    const spacing = 24.0;
    const radius = 1.5;

    for (double x = spacing; x < size.width; x += spacing) {
      for (double y = spacing; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), radius, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}