import { useState, useEffect} from 'react';
import Table from 'react-bootstrap/Table';
import { Button } from 'bootstrap';
//import Button from 'react-bootstrap/Button';
import { post } from './Utility.js';
import Modal from 'react-bootstrap/Modal';

const Ladder = ({ user }) => {


    const [users, setUsers] = useState();

    const getUsers = async () => {
        let response = await post('api/Users', null, null, "GET");
        if (response.ok)
            setUsers(await response.json());
        else
            setUsers(null);
    }

    useEffect(() => {
        getUsers();
    }, [setUsers]);

    const logMatch = async (result, opponent) => {
        let response = await post('api/ladder', { user:user.email, opponent:opponent, result:result }, null);

    };

    return (
        <>
            <Table striped>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Enter Result</th>
                    </tr>
                </thead>
                <tbody>
                    { users &&
                        Object.entries(users).map(([i, u]) => {
                        let isMember = u.roles.includes("Member");
                        let isAdmin = u.roles.includes("Admin");
                         if (!(isMember)) return false;
                        // console.log(u);
                           
                        <tr key={u.email}>
                            <td>{u.rank}</td>
                            <td>{u.name}</td>
                            <td><Button onClick={() => logMatch(1, u.email)}>Win</Button>
                                <Button onClick={() => logMatch(0, u.email)}>Lose</Button>
                            </td>
                        </tr> })}
                </tbody>
            </Table>
        </>);

};

export default Ladder;