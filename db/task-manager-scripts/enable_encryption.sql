-- Enable pgcrypto extension for API key encryption

-- Install pgcrypto extension if not already installed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt API keys
CREATE OR REPLACE FUNCTION task_manager.encrypt_api_key(plain_key TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Use pgp_sym_encrypt for symmetric encryption
    -- Returns base64 encoded encrypted data
    RETURN encode(pgp_sym_encrypt(plain_key, encryption_key), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt API keys
CREATE OR REPLACE FUNCTION task_manager.decrypt_api_key(encrypted_key TEXT, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Use pgp_sym_decrypt for symmetric decryption
    -- Input is base64 encoded encrypted data
    RETURN pgp_sym_decrypt(decode(encrypted_key, 'base64'), encryption_key);
EXCEPTION
    WHEN OTHERS THEN
        -- Return NULL if decryption fails (invalid key or corrupted data)
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Test the encryption functions work
DO $$
DECLARE
    test_key TEXT := 'test-api-key-12345';
    test_encryption_key TEXT := 'test-password-for-validation';
    encrypted TEXT;
    decrypted TEXT;
BEGIN
    -- Test encryption
    encrypted := task_manager.encrypt_api_key(test_key, test_encryption_key);
    
    -- Test decryption
    decrypted := task_manager.decrypt_api_key(encrypted, test_encryption_key);
    
    -- Verify the round-trip works
    IF decrypted = test_key THEN
        RAISE NOTICE 'Encryption test PASSED: API key encryption functions are working correctly';
    ELSE
        RAISE EXCEPTION 'Encryption test FAILED: Expected %, got %', test_key, decrypted;
    END IF;
END;
$$;

-- Grant execute permissions to the functions
GRANT EXECUTE ON FUNCTION task_manager.encrypt_api_key(TEXT, TEXT) TO postgres;
GRANT EXECUTE ON FUNCTION task_manager.decrypt_api_key(TEXT, TEXT) TO postgres;

RAISE NOTICE 'pgcrypto extension and encryption functions have been successfully installed';