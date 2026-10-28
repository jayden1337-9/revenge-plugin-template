@file:JvmName("BotClient")

package dev.jayden.botclient

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import io.github.revenge.bridge.asDelegate
import io.github.revenge.plugins.plugin
import io.github.revenge.xposed.api.registerNativeMethod
import java.io.File
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

private const val KEY_ALIAS = "dev.jayden.botclient.token.v1"

private fun getOrCreateKey(): SecretKey {
    val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    (store.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }

    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
    generator.init(
        KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
            .build()
    )
    return generator.generateKey()
}

private fun encrypt(plain: String): String {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, getOrCreateKey())
    val encrypted = cipher.doFinal(plain.toByteArray(Charsets.UTF_8))
    val iv = cipher.iv
    return Base64.encodeToString(iv + encrypted, Base64.NO_WRAP)
}

private fun decrypt(encoded: String): String {
    val bytes = Base64.decode(encoded, Base64.NO_WRAP)
    require(bytes.size > 12) { "Stored token data is invalid" }
    val iv = bytes.copyOfRange(0, 12)
    val ciphertext = bytes.copyOfRange(12, bytes.size)
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.DECRYPT_MODE, getOrCreateKey(), GCMParameterSpec(128, iv))
    return String(cipher.doFinal(ciphertext), Charsets.UTF_8)
}

@Suppress("UNUSED")
val botClientPlugin = plugin {
    start {
        val tokenFile = File(pluginDir, "bot-token.enc")

        registerNativeMethod("${manifest.id}.saveToken") { rawArgs ->
            val args = rawArgs.asDelegate()
            val token: String by args.string()
            require(token.isNotBlank()) { "Token cannot be blank" }
            tokenFile.parentFile?.mkdirs()
            tokenFile.writeText(encrypt(token))
            Unit
        }

        registerNativeMethod("${manifest.id}.loadToken") {
            if (!tokenFile.exists()) "" else decrypt(tokenFile.readText())
        }

        registerNativeMethod("${manifest.id}.deleteToken") {
            tokenFile.delete()
            // Remove the encryption key as well. A future login generates a new key.
            val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
            if (store.containsAlias(KEY_ALIAS)) store.deleteEntry(KEY_ALIAS)
            Unit
        }

        log.i("Bot Client native secure storage ready")
    }

    stop {
        log.i("Bot Client stopped")
    }
}
