export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    const config = useRuntimeConfig()

    if (!isEmailAllowed(user.email, config.allowedEmails)) {
      return denyAccess(event, 'access_denied')
    }

    const avatar = user.picture?.startsWith('//')
      ? `https:${user.picture}`
      : user.picture

    await setUserSession(event, {
      user: {
        email: user.email,
        name: user.name,
        avatar,
        googleId: user.sub,
      },
      loggedInAt: Date.now(),
    })

    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  },
})
