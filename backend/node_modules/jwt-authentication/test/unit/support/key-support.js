var privateKeyDataUri = 'data:application/pkcs8;kid=an-issuer%2Fthe-keyid;base64,MIICeAIBADANBgkqhkiG9w0BAQEFAASCAmIwggJeAgEAAoGBAM+lXQSOIVDRkQnebs3LP6mZj63a3ZqpR7+6pbo8u9497tv38jTtmfPrmSgaJ1+axnHLzzBqPUY7TL2cbC9nnKJwTx18Mh3Yau4zOBxJYkKaAn/b84fncpph30BcsjXKeXmuPBbLwo+tfxeGlOuUSj4+7nspz8seVcv25uzWxbplAgMBAAECgYEAkl3J95AIQ+O1DPPRvxZpxa8M7Eu+sWppvOhgMarl8n5NhJh+Dnj9cEa+Ktpkrqt2/nffkA0TLBJYwb8lMzUh3slUMjr8x1unZbO7yyU1xdQypL2NvpZj8qVWt2plGGWKdONpyGc20r0rY7cR1LFBv1ovAc1ug6e7uo++wE/6nfECQQDxPsI/Qo+mMqhp2t9GjpEjXOeK+fLf6g88X/RmdDWHm9QIpWVEPz33DRPvULJLa0hs9uAnZRMVn/ZOOWNWLcPTAkEA3FiIX5Zd7/5ScsvJ2dYMVbojV8+CbllvJKW6p6MhhLTY7fgpBeNVU2qJ/pNb9T7kpD85rJvgw3GSTE2ZvDR95wJBANoHXEsL/wO3uNmihDQiWS3aozDJYSXZRdfM6PdHg7GBtgnyYSli9r+2xBN/nQPoe9Zu8HrqMGtU3Kgp2YtjZR0CQCy+XZLrec/OGPfuoeJ2MLMHxT2DibzWtFcAwFJiMeA8yQApsErdyunRbIwhaD74sn0XyaJfVNjbKxYLe/hXwGkCQQDPBRpHKBZ+mtRthkuJNyo7cxpQQq8Gd/5azBSrGQ+M+7bSLbbKoAemSpqCu40zP1EdLhYKtgtVccLT6VvUeUZC'; // jshint ignore:line

var privateKeyPem = [
'-----BEGIN RSA PRIVATE KEY-----',
'MIICXgIBAAKBgQDPpV0EjiFQ0ZEJ3m7Nyz+pmY+t2t2aqUe/uqW6PLvePe7b9/I0',
'7Znz65koGidfmsZxy88waj1GO0y9nGwvZ5yicE8dfDId2GruMzgcSWJCmgJ/2/OH',
'53KaYd9AXLI1ynl5rjwWy8KPrX8XhpTrlEo+Pu57Kc/LHlXL9ubs1sW6ZQIDAQAB',
'AoGBAJJdyfeQCEPjtQzz0b8WacWvDOxLvrFqabzoYDGq5fJ+TYSYfg54/XBGvira',
'ZK6rdv5335ANEywSWMG/JTM1Id7JVDI6/Mdbp2Wzu8slNcXUMqS9jb6WY/KlVrdq',
'ZRhlinTjachnNtK9K2O3EdSxQb9aLwHNboOnu7qPvsBP+p3xAkEA8T7CP0KPpjKo',
'adrfRo6RI1znivny3+oPPF/0ZnQ1h5vUCKVlRD899w0T71CyS2tIbPbgJ2UTFZ/2',
'TjljVi3D0wJBANxYiF+WXe/+UnLLydnWDFW6I1fPgm5ZbySluqejIYS02O34KQXj',
'VVNqif6TW/U+5KQ/Oayb4MNxkkxNmbw0fecCQQDaB1xLC/8Dt7jZooQ0Ilkt2qMw',
'yWEl2UXXzOj3R4OxgbYJ8mEpYva/tsQTf50D6HvWbvB66jBrVNyoKdmLY2UdAkAs',
'vl2S63nPzhj37qHidjCzB8U9g4m81rRXAMBSYjHgPMkAKbBK3crp0WyMIWg++LJ9',
'F8miX1TY2ysWC3v4V8BpAkEAzwUaRygWfprUbYZLiTcqO3MaUEKvBnf+WswUqxkP',
'jPu20i22yqAHpkqagruNMz9RHS4WCrYLVXHC0+lb1HlGQg==',
'-----END RSA PRIVATE KEY-----'
].join('\r\n');

var publicKey = [
'-----BEGIN PUBLIC KEY-----',
'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDPpV0EjiFQ0ZEJ3m7Nyz+pmY+t',
'2t2aqUe/uqW6PLvePe7b9/I07Znz65koGidfmsZxy88waj1GO0y9nGwvZ5yicE8d',
'fDId2GruMzgcSWJCmgJ/2/OH53KaYd9AXLI1ynl5rjwWy8KPrX8XhpTrlEo+Pu57',
'Kc/LHlXL9ubs1sW6ZQIDAQAB',
'-----END PUBLIC KEY-----'
].join('\r\n');

module.exports = {
    privateKeyPem: privateKeyPem,
    privateKeyDataUri: privateKeyDataUri,
    publicKey: publicKey
};
