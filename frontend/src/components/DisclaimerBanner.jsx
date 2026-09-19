import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function DisclaimerBanner({ language = 'en' }) {
  const text = language === 'ta'
    ? 'சுயாதீன குடிமக்கள் உதவி தளம் • இது அதிகாரப்பூர்வ அரசு இணையதளம் அல்ல • தனிநபர் அல்லது பயோமெட்ரிக் தரவு சேகரிக்கப்படுவதில்லை'
    : 'Independent citizen assistance platform • Not an official government website • No personal or biometric data collected';

  return (
    <div className="disclaimer-banner" role="alert">
      <ShieldAlert size={16} />
      <span>{text}</span>
    </div>
  );
}
