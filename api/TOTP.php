<?php
/**
 * Clase TOTP - Time-based One-Time Password
 * Compatible con Google Authenticator, Authy, Microsoft Authenticator
 */
class TOTP {
    
    /**
     * Genera un secreto aleatorio en Base32
     * @param int $length Longitud del secreto (por defecto 16 caracteres)
     * @return string Secreto en Base32
     */
    public static function generateSecret($length = 16) {
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < $length; $i++) {
            $secret .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $secret;
    }
    
    /**
     * Genera el código TOTP de 6 dígitos
     * @param string $secret Secreto en Base32
     * @param int $timestamp Timestamp (por defecto ahora)
     * @param int $period Periodo en segundos (por defecto 30)
     * @return string Código de 6 dígitos
     */
    public static function generateCode($secret, $timestamp = null, $period = 30) {
        if ($timestamp === null) {
            $timestamp = time();
        }
        
        $counter = floor($timestamp / $period);
        $secretDecoded = self::base32Decode($secret);
        
        // Convertir counter a binario de 8 bytes
        $counterBytes = pack('N*', 0) . pack('N*', $counter);
        
        // HMAC-SHA1
        $hash = hash_hmac('sha1', $counterBytes, $secretDecoded, true);
        
        // Dynamic truncation
        $offset = ord($hash[strlen($hash) - 1]) & 0x0F;
        $binary = (
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF)
        );
        
        $code = $binary % 1000000;
        return str_pad($code, 6, '0', STR_PAD_LEFT);
    }
    
    /**
     * Verifica un código TOTP
     * @param string $code Código a verificar
     * @param string $secret Secreto en Base32
     * @param int $window Ventana de tolerancia (códigos anteriores/posteriores)
     * @return bool True si el código es válido
     */
    public static function verifyCode($code, $secret, $window = 1) {
        $timestamp = time();
        $period = 30;
        
        // Verificar el código actual y códigos en la ventana de tolerancia
        for ($i = -$window; $i <= $window; $i++) {
            $testTime = $timestamp + ($i * $period);
            $testCode = self::generateCode($secret, $testTime);
            if ($testCode === $code) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Genera una URL para código QR compatible con Google Authenticator
     * @param string $secret Secreto en Base32
     * @param string $issuer Nombre de la aplicación
     * @param string $account Cuenta del usuario (email o username)
     * @return string URL otpauth://
     */
    public static function getQRCodeUrl($secret, $issuer, $account) {
        $encodedIssuer = urlencode($issuer);
        $encodedAccount = urlencode($account);
        return "otpauth://totp/{$encodedIssuer}:{$encodedAccount}?secret={$secret}&issuer={$encodedIssuer}";
    }
    
    /**
     * Decodifica Base32
     * @param string $base32 String en Base32
     * @return string String decodificado
     */
    private static function base32Decode($base32) {
        $base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $base32 = strtoupper($base32);
        $decoded = '';
        $buffer = 0;
        $bitsLeft = 0;
        
        for ($i = 0; $i < strlen($base32); $i++) {
            $char = $base32[$i];
            if ($char === '=') {
                break;
            }
            
            $value = strpos($base32chars, $char);
            if ($value === false) {
                continue;
            }
            
            $buffer = ($buffer << 5) | $value;
            $bitsLeft += 5;
            
            if ($bitsLeft >= 8) {
                $decoded .= chr(($buffer >> ($bitsLeft - 8)) & 0xFF);
                $bitsLeft -= 8;
            }
        }
        
        return $decoded;
    }
}
?>