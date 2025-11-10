import { useEffect, useState, useActionState } from 'react';
import Form from 'react-bootstrap/Form';
//import Form.label from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

/**
 * ReactComponent
 * A reusable React component for the CourtBooking client.
 */
const Login = ({ user, setUser }) => {
    //const [name, setName] = useState('');
    //const [password, setPassword] = useState('');
    //const [email, setEmail] = useState('');
    const [loginErrorText, setLoginErrorText] = useState('');
    const [users, setUsers] = useState();
    const [state, action, isPending] = useActionState(handleLogin, null);

    useEffect(() => {
        const checkLogin = async () => {
            let response = await fetch('api/auth/check', { method: 'POST', credentials: 'include' });
            if (response.ok) {
                response.json().then(data => {
                    console.log("user data: ", JSON.stringify(data));
                    setUser(data);
                });
            }
        };
        checkLogin();
    }, [setUser]);

        const getUsers = async () => {
            let response = await fetch('api/Users',
                {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
            if (response.ok) {
                var _users = await response.json();
                setUsers(_users);
            }
    }

    useEffect(() => {
        getUsers();
    }, [user]);

    const deleteUser = async (email) => {
        let result = await post('api/Users', email, null, "DELETE");
        if (result.ok) getUsers();
    }

    const updateMembership = async (email, role) => {
        await post('api/Users/toggleRole', { email: email, role: role }, null, "PATCH");
    }

    const post = async (url, obj, errorResponses, method = "POST") => {
        let response = await fetch(url, {
            method: method,
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            ...(method !== "GET" && { body: JSON.stringify(obj) })
        });

        //setLoginErrorText('');
        //console.log(response);
        if (!response.ok) {
            if (errorResponses && response) {
                console.log(response);
                response = await response.json();
                setLoginErrorText(errorResponses(response));
            }
        }
        else {
            setLoginErrorText('Success');
        }

        return response;
    }

    const logout = async () => {
        await post('api/auth/logout', null, null, "GET");
    };

    const register = async (formData) => {
        await post('api/auth/register', {
            Email: formData.get('email'),
            Name: formData.get('name'),
            Password: formData.get('password')
        },
            (response) => {
                switch (response.status) {
                    case 401:
                        return 'Already registered';
                    default: {
                        return response;
                    }
                }
            }
        );
    }

    async function handleLogin(prevState, formData) {
        console.log(JSON.stringify(formData));
        var response = await post('/api/auth/login?useCookies=true', {
            Email: formData.get('email'),
            Name: formData.get('name'),
            Password: formData.get('password')
        },
            (response) => {
                switch (response.status) {
                    case 401:
                        return 'Invalid username or password';
                    default: {
                        return response;
                    }
                }
            }
        );
        if (response.ok) {
            response = await response.json();
            setUser(response)
        }
    }

    return (
        <>
            <h2>Login</h2>
            <Form action={action} style={{ marginBottom: '1rem' }} >
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto'
                }} >
                    <Form.Group className="mb-3" controlId="formBasicEmail">
                        <Form.Label>
                            <Form.Control name='email' autoComplete='Email' type="email" placeholder="Email" />
                        </Form.Label>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicName">
                        <Form.Label>
                            <Form.Control name='name' autoComplete='Name' type="text" placeholder="Name" />
                        </Form.Label>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>
                            <Form.Control name='password' autoComplete="current-password" type="password" placeholder="Password" />
                        </Form.Label>
                    </Form.Group>

                </div>
                <button variant="secondary" type="submit" id="login" disabled={isPending}>Login</button>
                <button variant="secondary" type="submit" id="reg" disabled={isPending} formAction={register}>Register</button>
                <button variant="secondary" type="button" id="logout" onClick={logout}>Logout</button>
                {loginErrorText && <div style={{ color: 'red' }}>{loginErrorText}</div>}
                <div>{state}</div>
            </Form>
            {users &&
                <div style={{ height: "200px", overflowY: "scroll" }}>
                    <table className="table table-striped" align="center">
                        <thead>
                            <tr><th>Username</th>
                                <th>Member</th>
                                <th>Admin</th>
                                <th>Remove</th>
                            </tr>

                        </thead>
                        <tbody>
                            {Object.entries(users).map(([i, thisUser]) => {
                                let isMember = thisUser.roles.includes("Member");
                                let isAdmin = thisUser.roles.includes("Admin");
                                return <tr key={i}>
                                    <td>{thisUser.name}</td>
                                    <td>
                                        <input type="checkbox"
                                            checked={isMember}
                                            onChange={() => { setUsers({ ...users, [i]: { ...thisUser, roles: isMember ? thisUser.roles.filter(v => v !== "Member") : thisUser.roles.concat("Member") } }); updateMembership(thisUser.email, "Member"); }}
                                        />
                                    </td>
                                    <td>
                                        <input type="checkbox"
                                            checked={isAdmin}
                                            onChange={() => { setUsers({ ...users, [i]: { ...thisUser, roles: isAdmin ? thisUser.roles.filter(v => v !== "Admin") : thisUser.roles.concat("Admin") } }); updateMembership(thisUser.email, "Admin"); }}
                                        />
                                    </td>
                                    <td>
                                        <input type="button"
                                            value="delete"
                                            onClick={() => { deleteUser(thisUser.email) }}
                                        />
                                    </td>
                                </tr>
                            })}
                        </tbody>
                    </table>
                </div>
            }
        </>
    );
};

export default Login;