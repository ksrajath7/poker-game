import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import { GOOGLE_CLIENT_ID } from '../../lib/env';

const GoogleAuth = ({ onAfterJWT = () => { }, onError = () => { }, }) => {
    // console.log(GOOGLE_CLIENT_ID)
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLogin
                // useOneTap={true}
                shape='circle'
                onSuccess={credentialResponse => {
                    onAfterJWT(credentialResponse)
                }}
                onError={() => {
                    onError('Login Failed');
                }}
            />
        </GoogleOAuthProvider>
    );
};

export default GoogleAuth;