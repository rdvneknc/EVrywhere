import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'home_screen.dart';


void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const EVrywhereApp());
}

class EVrywhereApp extends StatelessWidget {
  const EVrywhereApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'EVrywhere',
      theme: ThemeData(
        primarySwatch: Colors.green,
      ),
      home: const LoginScreen(),
    );
  }
}


// ─────────────────────────────────────────────
//  THEME CONSTANTS
// ─────────────────────────────────────────────
class EVColors {
  EVColors._();

  static const Color primary = Color(0xFF2DC653);      // vivid green
  static const Color primaryLight = Color(0xFFE8F9ED); // soft green tint
  static const Color primaryMid = Color(0xFFB6EFC5);   // medium green tint
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color background = Color(0xFFF6FBF7);   // near-white green
  static const Color textPrimary = Color(0xFF0D1B12);
  static const Color textSecondary = Color(0xFF5A7264);
  static const Color textHint = Color(0xFFADC4B4);
  static const Color border = Color(0xFFD4EBD9);
  static const Color borderFocus = Color(0xFF2DC653);
  static const Color divider = Color(0xFFE8F2EA);
  static const Color error = Color(0xFFD94F3D);
}

// ─────────────────────────────────────────────
//  REUSABLE: EV LOGO ICON
// ─────────────────────────────────────────────
class EVLogoIcon extends StatelessWidget {
  final double size;
  const EVLogoIcon({super.key, this.size = 72});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: EVColors.primary,
        borderRadius: BorderRadius.circular(size * 0.28),
        boxShadow: [
          BoxShadow(
            color: EVColors.primary.withValues(alpha: 0.30),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          // subtle arc / charge wave in background
          Positioned(
            bottom: size * 0.08,
            right: size * 0.06,
            child: CustomPaint(
              size: Size(size * 0.55, size * 0.55),
              painter: _ChargePainter(),
            ),
          ),
          // bolt icon
          Icon(
            Icons.electric_bolt_rounded,
            color: EVColors.onPrimary,
            size: size * 0.50,
          ),
        ],
      ),
    );
  }
}

class _ChargePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.12)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;

    for (int i = 0; i < 3; i++) {
      final rect = Rect.fromCenter(
        center: Offset(size.width * 0.3, size.height * 0.7),
        width: size.width * (0.4 + i * 0.28),
        height: size.height * (0.4 + i * 0.28),
      );
      canvas.drawArc(rect, -0.4, 1.2, false, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ─────────────────────────────────────────────
//  REUSABLE: PHONE INPUT FIELD
// ─────────────────────────────────────────────
class PhoneInputField extends StatefulWidget {
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;

  const PhoneInputField({
    super.key,
    required this.controller,
    this.onChanged,
  });

  @override
  State<PhoneInputField> createState() => _PhoneInputFieldState();
}

class _PhoneInputFieldState extends State<PhoneInputField> {
  final FocusNode _focus = FocusNode();
  bool _isFocused = false;

  @override
  void initState() {
    super.initState();
    _focus.addListener(() => setState(() => _isFocused = _focus.hasFocus));
  }

  @override
  void dispose() {
    _focus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: EVColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _isFocused ? EVColors.borderFocus : EVColors.border,
          width: _isFocused ? 1.5 : 1.0,
        ),
        boxShadow: _isFocused
            ? [
                BoxShadow(
                  color: EVColors.primary.withValues(alpha: 0.10),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ]
            : [],
      ),
      child: Row(
        children: [
          // Country code picker (static for now, wire up as needed)
          _CountryCodePill(isFocused: _isFocused),
          Container(width: 1, height: 24, color: EVColors.border),
          Expanded(
            child: TextField(
              controller: widget.controller,
              focusNode: _focus,
              onChanged: widget.onChanged,
              keyboardType: TextInputType.phone,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: EVColors.textPrimary,
                letterSpacing: 0.4,
              ),
              decoration: const InputDecoration(
                hintText: 'Phone number',
                hintStyle: TextStyle(
                  color: EVColors.textHint,
                  fontWeight: FontWeight.w400,
                  fontSize: 16,
                ),
                border: InputBorder.none,
                contentPadding:
                    EdgeInsets.symmetric(horizontal: 16, vertical: 18),
              ),
            ),
          ),
          // Clear button
          if (widget.controller.text.isNotEmpty)
            GestureDetector(
              onTap: () {
                widget.controller.clear();
                widget.onChanged?.call('');
                setState(() {});
              },
              child: Padding(
                padding: const EdgeInsets.only(right: 14),
                child: Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: EVColors.textHint.withValues(alpha: 0.3),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.close,
                      size: 12, color: EVColors.textSecondary),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _CountryCodePill extends StatelessWidget {
  final bool isFocused;
  const _CountryCodePill({required this.isFocused});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Row(
        children: [
          // Flag placeholder
          Container(
            width: 24,
            height: 16,
            decoration: BoxDecoration(
              color: EVColors.primaryMid,
              borderRadius: BorderRadius.circular(3),
            ),
            child: const Center(
              child: Text('🌍', style: TextStyle(fontSize: 11)),
            ),
          ),
          const SizedBox(width: 6),
          const Text(
            '+1',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: EVColors.textPrimary,
            ),
          ),
          const SizedBox(width: 4),
          const Icon(Icons.keyboard_arrow_down_rounded,
              size: 16, color: EVColors.textSecondary),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  REUSABLE: PRIMARY BUTTON
// ─────────────────────────────────────────────
class EVPrimaryButton extends StatefulWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;

  const EVPrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
  });

  @override
  State<EVPrimaryButton> createState() => _EVPrimaryButtonState();
}

class _EVPrimaryButtonState extends State<EVPrimaryButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 100));
    _scale = Tween(begin: 1.0, end: 0.96).animate(
        CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onPressed != null && !widget.isLoading;

    return GestureDetector(
      onTapDown: enabled ? (_) => _ctrl.forward() : null,
      onTapUp: enabled
          ? (_) {
              _ctrl.reverse();
              widget.onPressed?.call();
            }
          : null,
      onTapCancel: () => _ctrl.reverse(),
      child: ScaleTransition(
        scale: _scale,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          height: 56,
          decoration: BoxDecoration(
            color: enabled ? EVColors.primary : EVColors.primaryMid,
            borderRadius: BorderRadius.circular(16),
            boxShadow: enabled
                ? [
                    BoxShadow(
                      color: EVColors.primary.withValues(alpha: 0.35),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ]
                : [],
          ),
          child: Center(
            child: widget.isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: EVColors.onPrimary,
                    ),
                  )
                : Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        widget.label,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: enabled
                              ? EVColors.onPrimary
                              : EVColors.textSecondary,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(
                        Icons.arrow_forward_rounded,
                        color: enabled
                            ? EVColors.onPrimary
                            : EVColors.textSecondary,
                        size: 18,
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
//  REUSABLE: SOCIAL AUTH BUTTON
// ─────────────────────────────────────────────
class SocialAuthButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color iconColor;
  final VoidCallback? onPressed;

  const SocialAuthButton({
    super.key,
    required this.label,
    required this.icon,
    this.iconColor = EVColors.textPrimary,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: 52,
        decoration: BoxDecoration(
          color: EVColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: EVColors.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: iconColor, size: 20),
            const SizedBox(width: 10),
            Text(
              label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: EVColors.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  MAIN: LOGIN SCREEN
// ─────────────────────────────────────────────
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  final TextEditingController _phoneController = TextEditingController();
  bool _isLoading = false;
  bool _hasInput = false;
bool _showOtp = false;
String? _verificationId;
int? _resendToken;
final List<TextEditingController> _otpCtrls =
    List.generate(6, (_) => TextEditingController());
final List<FocusNode> _otpFocus =
    List.generate(6, (_) => FocusNode());
  late AnimationController _fadeCtrl;
  late AnimationController _slideCtrl;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _phoneController.addListener(
        () => setState(() => _hasInput = _phoneController.text.length >= 6));

    _fadeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _slideCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));

    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.06),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOutCubic));

    Future.delayed(const Duration(milliseconds: 100), () {
      _fadeCtrl.forward();
      _slideCtrl.forward();
    });
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _fadeCtrl.dispose();
    _slideCtrl.dispose();
    super.dispose();
  }

 Future<void> _handleContinue() async {
  if (!_hasInput) return;
  FocusScope.of(context).unfocus();
  setState(() => _isLoading = true);
  await Future.delayed(const Duration(milliseconds: 500));
  if (!mounted) return;
  Navigator.of(context).pushReplacement(
    MaterialPageRoute(builder: (_) => const HomeScreen()),
  );
}

Future<void> _verifyOtp() async {
  final otp = _otpCtrls.map((c) => c.text).join();
  if (otp.length < 6) return;
  setState(() => _isLoading = true);
  // TEST MODU
  if (_verificationId == 'test-verification-id') {
    if (otp == '123456') {
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } else {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Kod hatalı')),
      );
    }
    return;
  }
  try {
    final credential = PhoneAuthProvider.credential(
      verificationId: _verificationId!,
      smsCode: otp,
    );
    await _signIn(credential);
  } on FirebaseAuthException catch (e) {
    setState(() => _isLoading = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(e.message ?? 'Kod hatalı')),
    );
  }
}

Future<void> _signIn(PhoneAuthCredential credential) async {
  await FirebaseAuth.instance.signInWithCredential(credential);
  if (!mounted) return;
  Navigator.of(context).pushReplacement(
    MaterialPageRoute(builder: (_) => const HomeScreen()),
  );
}

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;
    final screenH = MediaQuery.of(context).size.height;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.dark,
      ),
      child: Scaffold(
        backgroundColor: EVColors.background,
        body: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnim,
            child: SlideTransition(
              position: _slideAnim,
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                padding: EdgeInsets.only(bottom: bottom),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: screenH -
                        MediaQuery.of(context).padding.top -
                        MediaQuery.of(context).padding.bottom,
                  ),
                  child: IntrinsicHeight(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 28),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 48),

                          // ── Logo & brand ──────────────────────────
                          Center(
                            child: Column(
                              children: [
                                const EVLogoIcon(size: 76),
                                const SizedBox(height: 20),
                                RichText(
                                  text: const TextSpan(
                                    children: [
                                      TextSpan(
                                        text: 'EV',
                                        style: TextStyle(
                                          fontSize: 32,
                                          fontWeight: FontWeight.w800,
                                          color: EVColors.primary,
                                          letterSpacing: -0.5,
                                        ),
                                      ),
                                      TextSpan(
                                        text: 'rywhere',
                                        style: TextStyle(
                                          fontSize: 32,
                                          fontWeight: FontWeight.w800,
                                          color: EVColors.textPrimary,
                                          letterSpacing: -0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'Share the drive',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w400,
                                    color: EVColors.textSecondary,
                                    letterSpacing: 0.2,
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(height: 52),

                          // ── Heading ───────────────────────────────
                          const Text(
                            'Welcome back',
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.w700,
                              color: EVColors.textPrimary,
                              letterSpacing: -0.4,
                            ),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Enter your phone number to continue',
                            style: TextStyle(
                              fontSize: 15,
                              color: EVColors.textSecondary,
                              height: 1.4,
                            ),
                          ),

                          const SizedBox(height: 28),

                          // ── Phone input / OTP ─────────────────────
                          if (!_showOtp) ...[
                            PhoneInputField(
                              controller: _phoneController,
                              onChanged: (_) {},
                            ),

                            const SizedBox(height: 12),

                            // SMS hint
                            Row(
                              children: const [
                                Icon(Icons.info_outline_rounded,
                                    size: 13, color: EVColors.textHint),
                                SizedBox(width: 6),
                                Text(
                                  'We\'ll send a verification code via SMS',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: EVColors.textHint,
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 32),

                            // ── Continue button ───────────────────────
                            EVPrimaryButton(
                              label: 'Continue',
                              onPressed: _hasInput ? _handleContinue : null,
                              isLoading: _isLoading,
                            ),
                          ] else ...[
                            // ── OTP input ─────────────────────────────
                            Text(
                              'Enter the 6-digit code sent to\n+90 ${_phoneController.text}',
                              style: const TextStyle(
                                fontSize: 15,
                                color: EVColors.textSecondary,
                                height: 1.4,
                              ),
                            ),

                            const SizedBox(height: 28),

                            // OTP boxes
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: List.generate(6, (i) {
                                return SizedBox(
                                  width: 46,
                                  height: 56,
                                  child: TextField(
                                    controller: _otpCtrls[i],
                                    focusNode: _otpFocus[i],
                                    textAlign: TextAlign.center,
                                    keyboardType: TextInputType.number,
                                    maxLength: 1,
                                    inputFormatters: [
                                      FilteringTextInputFormatter.digitsOnly
                                    ],
                                    style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w600,
                                      color: EVColors.textPrimary,
                                    ),
                                    decoration: InputDecoration(
                                      counterText: '',
                                      filled: true,
                                      fillColor: EVColors.surface,
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: const BorderSide(
                                            color: EVColors.border),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: const BorderSide(
                                            color: EVColors.border),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: const BorderSide(
                                            color: EVColors.borderFocus,
                                            width: 1.5),
                                      ),
                                    ),
                                    onChanged: (val) {
                                      if (val.isNotEmpty && i < 5) {
                                        _otpFocus[i + 1].requestFocus();
                                      } else if (val.isEmpty && i > 0) {
                                        _otpFocus[i - 1].requestFocus();
                                      }
                                    },
                                  ),
                                );
                              }),
                            ),

                            const SizedBox(height: 16),

                            // Resend
                            Align(
                              alignment: Alignment.centerRight,
                              child: TextButton(
                                onPressed: () {
                                  setState(() => _showOtp = false);
                                },
                                child: const Text(
                                  'Change number',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: EVColors.primary,
                                  ),
                                ),
                              ),
                            ),

                            const SizedBox(height: 16),

                            // ── Verify button ─────────────────────────
                            EVPrimaryButton(
                              label: 'Verify',
                              onPressed: _verifyOtp,
                              isLoading: _isLoading,
                            ),
                          ],

                          

                          const SizedBox(height: 32),

                          // ── Divider ───────────────────────────────
                          Row(
                            children: [
                              const Expanded(
                                  child: Divider(color: EVColors.divider)),
                              Padding(
                                padding:
                                    const EdgeInsets.symmetric(horizontal: 14),
                                child: Text(
                                  'or sign in with',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: EVColors.textHint,
                                    fontWeight: FontWeight.w400,
                                  ),
                                ),
                              ),
                              const Expanded(
                                  child: Divider(color: EVColors.divider)),
                            ],
                          ),

                          const SizedBox(height: 20),

                          // ── Social auth ───────────────────────────
                          Row(
                            children: [
                              Expanded(
                                child: SocialAuthButton(
                                  label: 'Google',
                                  icon: Icons.g_mobiledata_rounded,
                                  iconColor: const Color(0xFF4285F4),
                                  onPressed: () {},
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: SocialAuthButton(
                                  label: 'Apple',
                                  icon: Icons.apple_rounded,
                                  iconColor: EVColors.textPrimary,
                                  onPressed: () {},
                                ),
                              ),
                            ],
                          ),

                          const Spacer(),

                          // ── Footer ────────────────────────────────
                          Padding(
                            padding: const EdgeInsets.only(bottom: 24),
                            child: Center(
                              child: RichText(
                                textAlign: TextAlign.center,
                                text: TextSpan(
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: EVColors.textHint,
                                    height: 1.6,
                                  ),
                                  children: [
                                    const TextSpan(
                                        text: 'By continuing you agree to our '),
                                    TextSpan(
                                      text: 'Terms of Service',
                                      style: const TextStyle(
                                        color: EVColors.primary,
                                        fontWeight: FontWeight.w500,
                                        decoration: TextDecoration.underline,
                                        decorationColor: EVColors.primary,
                                      ),
                                    ),
                                    const TextSpan(text: ' and '),
                                    TextSpan(
                                      text: 'Privacy Policy',
                                      style: const TextStyle(
                                        color: EVColors.primary,
                                        fontWeight: FontWeight.w500,
                                        decoration: TextDecoration.underline,
                                        decorationColor: EVColors.primary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
