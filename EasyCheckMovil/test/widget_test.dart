// Smoke test de la app: el formulario de inicio de sesión (CU-01) se
// renderiza con sus campos y el botón de ingreso.

import 'package:flutter_test/flutter_test.dart';

import 'package:front_mobile_easycheck/main.dart';

void main() {
  testWidgets('muestra el formulario de inicio de sesión', (tester) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('Iniciar Sesión'), findsOneWidget);
    expect(find.text('Iniciar sesión'), findsOneWidget);
    expect(find.text('RUT (11111111-1)'), findsOneWidget);
    expect(find.text('Contraseña'), findsOneWidget);
  });
}
