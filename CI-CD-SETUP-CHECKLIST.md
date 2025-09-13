# Quick CI/CD Setup Checklist

## ✅ GitHub Secrets Setup

Add these secrets in your GitHub repository (**Settings** → **Secrets and variables** → **Actions**):

### Required Secrets:
1. **`SSH_USERNAME`** - Your server username (e.g., `ubuntu`, `root`, etc.)
2. **`SSH_PRIVATE_KEY`** - Your SSH private key content (NOT the public key)
3. **`SSH_PORT`** - SSH port (optional, defaults to `22`)

## 🔑 SSH Key Setup

### You provided this public key:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAqqQvw6OnEVJbfUBDl+UnmFOFXEx2luzcpMlrGLqx9/ seifeldin02@outlook.com
```

### What you need to do:

1. **Find your private key** (this is what GitHub needs):
   ```bash
   # If you used ED25519 (recommended)
   cat ~/.ssh/id_ed25519
   
   # If you used RSA
   cat ~/.ssh/id_rsa
   ```

2. **Copy the ENTIRE private key output** including:
   - `-----BEGIN OPENSSH PRIVATE KEY-----`
   - All the key content
   - `-----END OPENSSH PRIVATE KEY-----`

3. **Add your public key to the server** (if not already done):
   ```bash
   # Method 1: Using ssh-copy-id
   ssh-copy-id your-username@18.144.88.135
   
   # Method 2: Manual
   ssh your-username@18.144.88.135
   echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAqqQvw6OnEVJbfUBDl+UnmFOFXEx2luzcpMlrGLqx9/ seifeldin02@outlook.com" >> ~/.ssh/authorized_keys
   ```

## 🚀 Test Your Setup

1. **Test SSH connection locally**:
   ```bash
   ssh your-username@18.144.88.135
   ```

2. **Commit and push to trigger deployment**:
   ```bash
   git add .
   git commit -m "Setup CI/CD"
   git push origin main
   ```

3. **Check GitHub Actions** tab for deployment status

4. **Access your app** at: `http://18.144.88.135:3000`

## ⚠️ Common Issues

- **"Permission denied"** → Check your private key in GitHub secrets
- **"Host key verification failed"** → Accept the host key when first connecting
- **"Secret name invalid"** → Use only letters, numbers, and underscores in secret names
- **"Authentication failed"** → Make sure you're using the private key, not public key

## 📋 Example Secret Values

```
SSH_USERNAME: ubuntu
SSH_PRIVATE_KEY: -----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
... (your actual private key content) ...
-----END OPENSSH PRIVATE KEY-----
SSH_PORT: 22
```