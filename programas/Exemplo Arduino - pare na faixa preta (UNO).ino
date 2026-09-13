/*
  Faixa preta
  Gerado pelo Portal da Robótica CROCOBOTS (bancada de simulação) para Arduino UNO.
  Programas grandes (seguidor completo com resgate) passam dos 32 KB do UNO: use um Arduino Mega 2560
  com as mesmas ligações (Ferramentas > Placa > Arduino Mega or Mega 2560).

  Ligações (as mesmas do robô da bancada):
    Ponte H L298N .... motor esquerdo: ENA 5, IN1 7, IN2 8 | motor direito: ENB 6, IN3 9, IN4 10
    Servo da pá ...... sinal no pino 3
    Buzzer ........... pino 4
    Ultrassônico ..... HC-SR04: TRIG 12, ECHO 11
    Sensores de linha  TCRT5000 (saída analógica): esquerdo A0, direito A1
    Sensores de cor .. TCS3200 com S0 e S1 em 5V: S2 A2 e S3 A3 (ligados nos dois), OUT esquerdo 2, OUT direito 13
    Giroscópio ....... MPU-6050 no I2C: SDA A4, SCL A5
  Bibliotecas: Servo e Wire (já vêm com a Arduino IDE). Não precisa instalar nada.

  Calibre no robô de verdade: CM_POR_SEGUNDO (quantos cm ele anda em 1 s a 100%) e os limites de cor em corDetectada().

  BANCADA-PROJETO (não apague: é por aqui que a bancada abre este arquivo de volta em blocos)
eyJmb3JtYXRvIjoiYmFuY2FkYS1vYnIiLCJ2ZXJzYW8iOjEsInBsYXRhZm9ybWEiOiJhcmR1aW5vIiwibm9tZSI6IkZhaXhhIHBy
ZXRhIiwicHJvZyI6eyJzY3JpcHRzIjpbeyJpZCI6ImIzNzU2NiIsIngiOjQwLCJ5Ijo0MCwicGlsaGEiOlt7ImlkIjoiYjM3NTY3
Iiwib3AiOiJldl9pbmljaW8iLCJhIjp7fSwiYyI6W119LHsiaWQiOiJiMzc1NjgiLCJvcCI6Im1vdl92ZWwiLCJhIjp7IlZBTCI6
eyJsaXQiOiIzMCJ9fSwiYyI6W119LHsiaWQiOiJiMzc1NjkiLCJvcCI6Im1vdl9pbmljaWFyIiwiYSI6eyJESVIiOnsibGl0Ijoi
Zm9yd2FyZCJ9fSwiYyI6W119LHsiaWQiOiJiMzc1NzEiLCJvcCI6ImN0bF9lc3BlcmFyX2F0ZSIsImEiOnsiQ09ORCI6eyJpZCI6
ImIzNzU3MCIsIm9wIjoic2VuX2Vjb3IiLCJhIjp7IlAiOnsibGl0IjoiU0QifSwiQ09SIjp7ImxpdCI6IjAifX0sImMiOltdfX0s
ImMiOltdfSx7ImlkIjoiYjM3NTcyIiwib3AiOiJtb3ZfcGFyYXIiLCJhIjp7fSwiYyI6W119LHsiaWQiOiJiMzc1NzMiLCJvcCI6
Imx1el90ZXh0byIsImEiOnsiVFhUIjp7ImxpdCI6ImFjaGVpIGEgZmFpeGEifX0sImMiOltdfV19XSwidmFycyI6W10sInByb2Nz
IjpbXX19
*/
#include <Servo.h>
#include <Wire.h>

const int ME_EN = 5, ME_IN1 = 7, ME_IN2 = 8;
const int MD_EN = 6, MD_IN3 = 9, MD_IN4 = 10;
const int SERVO_PINO = 3, BUZZER = 4, US_TRIG = 12, US_ECHO = 11;
const int LINHA_ESQ = A0, LINHA_DIR = A1, COR_S2 = A2, COR_S3 = A3, COR_OUT_ESQ = 2, COR_OUT_DIR = 13;
const int MPU = 0x68;

float CM_POR_SEGUNDO = 45.0;     // a 100%: meça no seu robô
float velocidadeMov = 50;        // % usada por andar() e moverComDirecao()
unsigned long inicioCron = 0;
Servo servo;
float guinada = 0, derivaGiro = 0;
unsigned long ultimoGiro = 0;



float divide(float a, float b) { return b == 0 ? 0 : a / b; }
float cronometro() { return (millis() - inicioCron) / 1000.0; }

void motor(int en, int a, int b, float pct) {
  pct = constrain(pct, -100, 100);
  digitalWrite(a, pct >= 0 ? HIGH : LOW);
  digitalWrite(b, pct >= 0 ? LOW : HIGH);
  analogWrite(en, (int)(fabs(pct) * 2.55));
}
void motores(float esq, float dir) { motor(ME_EN, ME_IN1, ME_IN2, esq); motor(MD_EN, MD_IN3, MD_IN4, dir); }
void motorPorta(int p, float pct) {   // 0 = esquerdo, 1 = direito
  if (p == 0) motor(ME_EN, ME_IN1, ME_IN2, pct);
  else if (p == 1) motor(MD_EN, MD_IN3, MD_IN4, pct);
}
void pararTudo() { motores(0, 0); while (true) delay(100); }

/* giroscópio: integra o eixo Z do MPU-6050 (graus, positivo = virou para a direita) */
int16_t leRegistro16(int reg) {
  Wire.beginTransmission(MPU); Wire.write(reg); Wire.endTransmission(false);
  Wire.requestFrom(MPU, 2); return (Wire.read() << 8) | Wire.read();
}
void iniciaGiro() {
  Wire.begin(); Wire.beginTransmission(MPU); Wire.write(0x6B); Wire.write(0); Wire.endTransmission();
  long soma = 0; for (int i = 0; i < 200; i++) { soma += leRegistro16(0x47); delay(2); }
  derivaGiro = soma / 200.0; ultimoGiro = micros();
}
void atualizaSensores() {
  unsigned long agora = micros();
  float dt = (agora - ultimoGiro) / 1000000.0; ultimoGiro = agora;
  guinada -= (leRegistro16(0x47) - derivaGiro) / 131.0 * dt;
}
float anguloGuinada() { atualizaSensores(); return guinada; }
float anguloInclinacao(char eixo) {
  float ax = leRegistro16(0x3B), ay = leRegistro16(0x3D), az = leRegistro16(0x3F);
  if (eixo == 'r') return atan2(ay, az) * 57.3;
  return atan2(-ax, sqrt(ay * ay + az * az)) * 57.3;
}
void esperar(float s) { unsigned long t = millis(); while (millis() - t < s * 1000) atualizaSensores(); }

/* sensores de linha e de cor */
int lerLinha(int lado) { return analogRead(lado == 0 ? LINHA_ESQ : LINHA_DIR); }
int lerCanal(int lado, char canal) {
  digitalWrite(COR_S2, canal == 'g' ? HIGH : LOW);
  digitalWrite(COR_S3, canal == 'r' ? LOW : HIGH);
  unsigned long p = pulseIn(lado == 0 ? COR_OUT_ESQ : COR_OUT_DIR, LOW, 40000);
  if (p == 0) return 0;
  return constrain(map(p, 400, 40, 0, 255), 0, 255);   // pulso curto = muita luz
}
/* 0 preto, 3 azul, 6 verde, 7 amarelo, 9 vermelho, 10 branco (os mesmos números do SPIKE) */
int corDetectada(int lado) {
  int r = lerCanal(lado, 'r'), g = lerCanal(lado, 'g'), b = lerCanal(lado, 'b');
  int mx = max(r, max(g, b)), mn = min(r, min(g, b));
  if (mx < 55) return 0;
  if (mx - mn < 40) return mx < 105 ? 0 : 10;
  if (g == mx) return 6;
  if (r == mx) return g > b + 40 ? 7 : 9;
  return 3;
}
float distanciaCm() {
  digitalWrite(US_TRIG, LOW); delayMicroseconds(2);
  digitalWrite(US_TRIG, HIGH); delayMicroseconds(10); digitalWrite(US_TRIG, LOW);
  unsigned long t = pulseIn(US_ECHO, HIGH, 25000);
  return t == 0 ? 200 : t / 58.0;
}
void bipe(float nota, float segundos) {
  tone(BUZZER, 440.0 * pow(2, (nota - 69) / 12.0), (unsigned long)(segundos * 1000));
  esperar(segundos);
}

/* andar: sem encoder, a distância sai do tempo (calibre CM_POR_SEGUNDO) */
float segundosPara(float valor, bool emSegundos) {
  if (emSegundos) return valor;
  return fabs(valor) / (CM_POR_SEGUNDO * velocidadeMov / 100.0);
}
void comecarAMover(char dir) {   // f frente, b trás, e esquerda, d direita
  float v = velocidadeMov;
  if (dir == 'b') motores(-v, -v); else if (dir == 'e') motores(-v, v); else if (dir == 'd') motores(v, -v); else motores(v, v);
}
void andar(char dir, float valor, bool emSegundos) { comecarAMover(dir); esperar(segundosPara(valor, emSegundos)); motores(0, 0); }
void moverComDirecao(float d) {
  float v = velocidadeMov, k = constrain(d, -100, 100);
  if (k >= 0) motores(v, v * (1 - 2 * k / 100)); else motores(v * (1 + 2 * k / 100), v);
}
void andarComDirecao(float d, float valor, bool emSegundos) { moverComDirecao(d); esperar(segundosPara(valor, emSegundos)); motores(0, 0); }


void programa() {
  velocidadeMov = 30;
  comecarAMover('f');
  while (!((corDetectada(1) == 0))) atualizaSensores();
  motores(0, 0);
  Serial.println(F("achei a faixa"));
}

void setup() {
  Serial.begin(9600);
  pinMode(ME_EN, OUTPUT); pinMode(ME_IN1, OUTPUT); pinMode(ME_IN2, OUTPUT);
  pinMode(MD_EN, OUTPUT); pinMode(MD_IN3, OUTPUT); pinMode(MD_IN4, OUTPUT);
  pinMode(US_TRIG, OUTPUT); pinMode(US_ECHO, INPUT); pinMode(BUZZER, OUTPUT);
  pinMode(COR_S2, OUTPUT); pinMode(COR_S3, OUTPUT); pinMode(COR_OUT_ESQ, INPUT); pinMode(COR_OUT_DIR, INPUT);
  servo.attach(SERVO_PINO);
  iniciaGiro();
  randomSeed(analogRead(A6));
  inicioCron = millis();
  programa();
  motores(0, 0);
}

void loop() {
}
