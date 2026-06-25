export const stravaService = {
  getAuthorizeUrl: (clientId, redirectUri) => {
    const scope = 'read,activity:read_all';
    return `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${scope}&approval_prompt=force`;
  }
};
