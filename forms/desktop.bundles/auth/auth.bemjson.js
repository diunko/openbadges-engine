({
    block: 'page',
    title: 'Authorization',
    styles: [
        { elem: 'css', url: '_auth.css' }
    ],
    scripts: [
        { elem: 'js', url: '_auth.js' },
    ],
    mods: {
        theme: 'normal'
    },
    content: {
        block: 'auth',
        content: {
            block: 'form',
            action: '/auth',
            method: 'post',
            content: [
                {
                    content: {
                        tag: 'b',
                        content: 'Authorization:'
                    }
                },
                { tag: 'br' },
                {
                    content: {
                        block: 'input',
                        name: 'username',
                        mods: { theme: 'normal', size: 'm', 'has-clear': true },
                        placeholder: 'Username...'
                    }
                },
                { tag: 'br' },
                {
                    content: {
                        block: 'input',
                        name: 'password',
                        mods: { theme: 'normal', size: 'm', 'has-clear': true, type: 'password' },
                        placeholder: 'Password...'
                    }
                },
                { tag: 'br' },
                {
                    block: 'button',
                    text: 'Sign In',
                    mods: { type: 'submit', theme: 'normal', size: 'm', view: 'action' }
                },
                ' ',
                {
                    block: 'spin',
                    mods: { theme: 'normal', size: 'm' }
                },
                ' ',
                {
                    block: 'error',
                    mods: { disabled: true },
                    content: 'Invalid username or password!'
                }
            ]
        }
    }
});
