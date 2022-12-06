import crypto from 'crypto';

export function gravatarURL(email?: string) {
    const md5 = !email ? '' : crypto.createHash('md5').update(email).digest('hex');
    return `https://gravatar.com/avatar/${md5}?s=${200}&d=retro`;
  }