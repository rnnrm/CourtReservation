
import { useActionState } from 'react';
import { useNavigate } from "react-router";;
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { post } from './Utility.js';
import { useSearchParams } from "react-router";

const ResetPassword = () => {

    const [searchParams, _] = useSearchParams();
    let resetToken = searchParams.get("token");
    let email = searchParams.get("email");
    //console.log("Resetting password for ", email, " with token ", resetToken);
    const [state, action, isPending] = useActionState(changePassword, null);
    let navigate = useNavigate();

    async function changePassword(prevState, formData) {
        var response = await post('/api/auth/changePassword', {
            UserEmail: email,
            ResetToken: resetToken,
            NewPassword: formData.get('password')
        }, null);

        if (response.ok) {
            navigate("/");
            return 'Password changed succesfully';
        } else {
            if (response.status === 404)
                return 'User not found';
            else
                return 'Error changing password: '+ response;
        }
    }

    return (
        <>
            <div className="p-4">
                <h2 className="my-3">Reset password</h2>
                <Form action={action} style={{ marginBottom: '1rem' }} >
                    <Form.Group className="mb-3" controlId="formBasicPassword">
                        <Form.Label>
                            <Form.Control required name='password' type="password" placeholder="New Password" />
                        </Form.Label>
                    </Form.Group>
                    <Button className="m-1" variant="secondary" type="submit" id="change" disabled={isPending}>
                        Change password
                    </Button>
                    <div>{state}</div>
                </Form>
            </div>
        </>)
};

export default ResetPassword;