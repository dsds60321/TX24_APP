package kr.tx24.fc.util;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import kr.tx24.fc.enums.TxResultCode;
import kr.tx24.fc.exception.TxException;
import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.lib.map.TypeRegistry;
import kr.tx24.lib.otp.TOTPUtils;
import kr.tx24.lib.redis.RedisUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;

public final class OtpUtil {

	private static final int DEFAULT_QR_SIZE = 220;
	private static final long OTP_SECRET_TTL_SECONDS = Duration.ofDays(365).getSeconds();
	private static final String OTP_SECRET_KEY = "OTP:SECRET:%s";

	private static final String OTP_ISSUER = "TX24";


	private OtpUtil() {
	}

	public static OtpProvisioning createProvisioning(String accountName) {
		String secret = TOTPUtils.generateSecretKey();
		return provisioningFromSecret(accountName, secret);
	}

	public static OtpProvisioning provisioningFromSecret( String accountName, String secret) {
		String otpAuthUrl = TOTPUtils.getOTPAuthURL(OTP_ISSUER, accountName, secret);
		byte[] qrBytes = createQrImage(otpAuthUrl, DEFAULT_QR_SIZE, DEFAULT_QR_SIZE);
		return new OtpProvisioning(secret, otpAuthUrl, qrBytes);
	}

	public static boolean validateOtp(String base32Secret, String otpValue) {
		return TOTPUtils.validateTOTP(base32Secret, otpValue);
	}

	public static String getOrCreateUserSecret(String userId) {
		String secret = getUserSecret(userId);
		if (CommonUtils.isEmpty(secret)) {
			secret = TOTPUtils.generateSecretKey();
			saveUserSecret(userId, secret);
		}
		return secret;
	}

	public static String getUserSecret(String userId) {
		if (CommonUtils.isEmpty(userId)) {
			return null;
		}
		return RedisUtils.get(formatSecretKey(userId), TypeRegistry.STRING);
	}

	public static void saveUserSecret(String userId, String secret) {
		if (CommonUtils.isEmpty(userId) || CommonUtils.isEmpty(secret)) {
			throw new TxException(TxResultCode.INVALID_REQUEST, "OTP 시크릿이 유효하지 않습니다.");
		}
		RedisUtils.set(formatSecretKey(userId), secret, OTP_SECRET_TTL_SECONDS);
	}

	private static String formatSecretKey(String userId) {
		return String.format(OTP_SECRET_KEY, userId);
	}

	public static byte[] createQrImage(String otpAuthUrl, int width, int height) {
		try {
			BitMatrix matrix = new QRCodeWriter().encode(otpAuthUrl, BarcodeFormat.QR_CODE, width, height);
			BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

			for (int x = 0; x < width; x++) {
				for (int y = 0; y < height; y++) {
					image.setRGB(x, y, matrix.get(x, y) ? 0xFF000000 : 0xFFFFFFFF);
				}
			}

			try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
				ImageIO.write(image, "PNG", out);
				return out.toByteArray();
			}
		} catch (WriterException | IOException e) {
			throw new TxException(TxResultCode.INTERNAL_ERROR, "OTP QR 이미지를 생성할 수 없습니다.", e);
		}
	}

	public static class OtpProvisioning {
		private final String secret;
		private final String otpAuthUrl;
		private final byte[] qrImageBytes;

		public OtpProvisioning(String secret, String otpAuthUrl, byte[] qrImageBytes) {
			this.secret = secret;
			this.otpAuthUrl = otpAuthUrl;
			this.qrImageBytes = qrImageBytes;
		}

		public String getSecret() {
			return secret;
		}

		public String getOtpAuthUrl() {
			return otpAuthUrl;
		}

		public byte[] getQrImageBytes() {
			return qrImageBytes;
		}
	}
}
