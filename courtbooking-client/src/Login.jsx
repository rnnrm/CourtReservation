import { useEffect, useState, useActionState } from 'react';
import Form from 'react-bootstrap/Form';
import { post } from './Utility.js';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';

const Login = ({ user, setUser }) => {
    const [loginErrorText, setLoginErrorText] = useState('');
    const [users, setUsers] = useState();
    const [state, action, isPending] = useActionState(handleLogin, null);
    const [forgotState, forgotAction, forgotIsPending] = useActionState(forgotPassword, null);

    let navigate = useNavigate();

    const getUsers = async () => {
        let response = await post('/api/Users', null, null, "GET");
        if (response.ok)
            setUsers(await response.json());
        else
            setUsers(null);
    }

    useEffect(() => {
        if (user?.role === "Admin")
            getUsers();
    }, [user]);

    const deleteUser = async (id) => {
        let result = await post('/api/Users', id, null, "DELETE");
        if (result.ok)
            getUsers();
    }

    const updateMembership = async (id, role) => {
        await post('/api/Users/toggleRole', { Id: id, Role: role }, null, "PATCH");
    }

    const updateMembershipNumber = async (id, memberNumber) => {
        await post('/api/Users/setMemberNumber', { Id: id, MemberNumber: memberNumber }, null);
    }

    const logout = async () => {
        await post('/api/auth/logout', null, null, "GET");
        setUser(null);
        setLoginErrorText('Logged out.');
    };

    const register = async (formData) => {

        setLoginErrorText("Loading...");
        var response = await post('/api/auth/register', {
            Email: formData.get('email'),
            Name: formData.get('name'),
            Password: formData.get('password')
        },
            (response) => {
                let message = response;
                if (response.title) {
                    if (response.errors) {
                        message = Object.values(response.errors).join(" ");
                    }
                    else
                        message = response.title;
                }
                setLoginErrorText(message);
            }
        );
        if (response.ok) {
            setLoginErrorText('Registered successfully.');
            handleLogin(null, formData);
        }
    }

    async function handleLogin(prevState, formData) {
        var response = await post('/api/auth/login?useCookies=true', {
            Email: formData.get('email'),
            Name: formData.get('name'),
            Password: formData.get('password')
        },
            (response) => {
                let message = response;
                if (response.title) {
                    if (response.errors) {
                        message = Object.values(response.errors).join(" ");
                    }
                    else
                        message = response.title;
                }
                setLoginErrorText(message);
            }
        );
        if (response.ok) {
            response = await response.json();
            setUser(response)
            setLoginErrorText('Logged in as ' + response.name);
            navigate("/reservations");
        }
    }

    async function forgotPassword(prevState, formData) {
        var email = formData.get('email');
        var response = await post("/api/auth/sendResetLink", { userEmail: email }, null);
        if (response.ok)
            alert("Email with reset link was sent to: " + email);
        else
            alert(response);
    }

    return (
        <div className="p-4">
            <h2 className="my-3">Login</h2>
            <Form action={action} style={{ marginBottom: '1rem' }} >
                {user === null ? (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto' }} >
                            <Form.Group className="mb-3" controlId="formBasicEmail">
                                <Form.Label>
                                    <Form.Control required name='email' autoComplete='Email' type="email" placeholder="Email" />
                                </Form.Label>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicName">
                                <Form.Label>
                                    <Form.Control name='name' autoComplete='Name' type="text" placeholder="Name" />
                                </Form.Label>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label>
                                    <Form.Control required name='password' autoComplete="current-password" type="password" placeholder="Password" />
                                </Form.Label>
                            </Form.Group>
                        </div>
                        <div >
                            <Button className="m-1" variant="secondary" type="submit" id="login" disabled={isPending}>
                                Login
                            </Button>
                            <Button className="m-1" variant="secondary" type="submit" id="reg" disabled={isPending} formAction={register}>
                                Register
                            </Button>
                            <br/>
                            <Button variant="" type="submit" formAction={forgotAction} disabled={forgotIsPending}><u>Reset password</u></Button>
                            {/*<br/>
                            <Button className="m-1" id="google" onClick={() => window.location.href = "/api/auth/login-google"} type="submit" formAction={() => { }}>
                                Sign in with Google
                            </Button>*/}
                        </div>
                        
                    </>)
                    :
                    <Button variant="secondary" type="button" id="logout" onClick={logout}>Logout</Button>
                }
                {isPending || forgotIsPending ? <>Loading...<br/></> : "" }
                {loginErrorText && <div style={{ color: 'red' }}>{loginErrorText}</div>}
                <div>{state}</div>
                <p className="my-3">If you are a member, let a club administrator know your display name after you register so that they can activate your account.</p>
            </Form>
            {users && user &&
                <div style={{ height: "400px", overflowY: "scroll" }}>
                    <table className="table table-striped" align="center">
                        <thead>
                            <tr><th>Username</th>
                                <th>Member</th>
                                <th>Admin</th>
                                <th>Membership #</th>
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
                                            onChange={() => {
                                                setUsers({
                                                    ...users,
                                                    [i]: {
                                                        ...thisUser, roles: isMember ?
                                                            thisUser.roles.filter(v => v !== "Member")
                                                            : thisUser.roles.concat("Member")
                                                    }
                                                }); updateMembership(thisUser.id, "Member");
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input type="checkbox"
                                            checked={isAdmin}
                                            onChange={() => {
                                                setUsers({
                                                    ...users,
                                                    [i]: {
                                                        ...thisUser, roles: isAdmin ?
                                                            thisUser.roles.filter(v => v !== "Admin")
                                                            : thisUser.roles.concat("Admin")
                                                    }
                                                }); updateMembership(thisUser.id, "Admin");
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input type="text"
                                            value={thisUser.memberNumber}
                                            size="7"
                                            onChange={(e) => {
                                                setUsers({
                                                    ...users,
                                                    [i]: {
                                                        ...thisUser, memberNumber: e.target.value
                                                    }
                                                }); updateMembershipNumber(thisUser.id, e.target.value);
                                            }}
                                        />
                                    </td>
                                    <td>
                                        <input type="button"
                                            value="delete"
                                            onClick={() => { deleteUser(thisUser.id) }}
                                        />
                                    </td>
                                </tr>
                            })}
                        </tbody>
                    </table>
                </div>
            }
        </div>
    );
};

export default Login;