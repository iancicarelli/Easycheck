import 'package:flutter/material.dart';

import 'api_client.dart';
import 'subjects_screen.dart';

// CU-01 — formulario de inicio de sesión del estudiante.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController rutController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  bool isLoading = false;
  bool isPasswordVisible = false;

  // CU-01: POST /api/v1/auth/login con {rut, password}; guarda la sesión
  // (token + perfil) y navega a las asignaturas si el rol es estudiante.
  Future<void> _login() async {
    final String rut = rutController.text.trim();
    final String password = passwordController.text;

    setState(() {
      isLoading = true;
    });

    try {
      final session = await ApiClient.login(rut, password);

      if (!mounted) return;
      setState(() {
        isLoading = false;
      });

      if (session.role != 'estudiante') {
        _showError(
          'La aplicación móvil es solo para estudiantes. '
          'Su rol (${session.role}) debe usar el panel web.',
        );
        return;
      }

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => SubjectsScreen(session: session),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        isLoading = false;
      });
      _showError(e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        isLoading = false;
      });
      _showError(
        'No se pudo conectar con el servidor ($apiBaseUrl). '
        '¿Está corriendo el backend?',
      );
    }
  }

  void _showError(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Error'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F1F1),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logos
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Image.asset(
                    'assets/easycheck_logo.png',
                    height: 80,
                  ),
                  const SizedBox(width: 16),
                  Image.asset(
                    'assets/ufro_logo.png',
                    height: 80,
                  ),
                ],
              ),
              const SizedBox(height: 32),
              // Título
              const Text(
                'Iniciar Sesión',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF002B5B),
                ),
              ),
              const SizedBox(height: 50),
              // Campo de RUT (el backend autentica con RUT institucional)
              TextField(
                controller: rutController,
                decoration: InputDecoration(
                  hintText: 'RUT (11111111-1)',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10.0),
                    borderSide: BorderSide(
                      color: Colors.black.withValues(alpha: 0.27),
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    vertical: 16.0,
                    horizontal: 16.0,
                  ),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.clear, color: Colors.grey),
                    onPressed: () {
                      rutController.clear();
                    },
                  ),
                ),
                keyboardType: TextInputType.visiblePassword,
              ),
              const SizedBox(height: 16),
              // Campo de contraseña
              TextField(
                controller: passwordController,
                obscureText: !isPasswordVisible,
                decoration: InputDecoration(
                  hintText: 'Contraseña',
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10.0),
                    borderSide: BorderSide(
                      color: Colors.black.withValues(alpha: 0.27),
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    vertical: 16.0,
                    horizontal: 16.0,
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(
                      isPasswordVisible
                          ? Icons.visibility
                          : Icons.visibility_off,
                      color: Colors.grey,
                    ),
                    onPressed: () {
                      setState(() {
                        isPasswordVisible = !isPasswordVisible;
                      });
                    },
                  ),
                ),
              ),
              const SizedBox(height: 34),
              // Botón de iniciar sesión
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: isLoading ? null : _login,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF002B5B),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12.0),
                    ),
                  ),
                  child: isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'Iniciar sesión',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
