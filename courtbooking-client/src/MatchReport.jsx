import { useState, useEffect, useActionState } from 'react';
import Button from 'react-bootstrap/Button';
import { post } from './Utility.js';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Stack from 'react-bootstrap/Stack';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useParams } from "react-router-dom";

const MatchReport = ({ user, updateDisplay }) => {
    const { competitionName } = useParams();
    const doubles = competitionName === "Doubles Ladder";
    const [matchStatus, setMatchStatus] = useState(null);
    const [score, setScore] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const [opponent, setOpponent] = useState(null);
    const [opponent2, setOpponent2] = useState(null);
    const [partner, setPartner] = useState(null);
    const td = new Date();
    const twoWeeksAgo = new Date(td.getYear(), td.getMonth(), td.getDay() - 14).toISOString().split('T')[0];
    const today = td.toISOString().split('T')[0];
    const [datePlayed, setDate] = useState(today);
    const [sets, setSets] = useState(1);
    const [show, setShow] = useState(false);
    const handleClose = () => {
        setScore([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        setOpponent(null);
        setOpponent2(null);
        setPartner(null);
        setShow(false)
    };
    const handleShow = () => { setMatchStatus(null); setShow(true) };
    const [users, setUsers] = useState(null);
    const [error, setError] = useState(null);
    const [state, action, isPending] = useActionState(logMatch, null);


    useEffect(() => {
        getUsers();
    }, []);

    const getUsers = async () => {
        let response = await post('/api/Users', null, null, "GET");
        if (response.ok)
            setUsers(await response.json());
        else
            setUsers(null);
    }

    const players = users &&
        Object.values(users).filter(u => u.roles.includes("Member") && (u.id !== user?.id));

    async function logMatch(prevState, formData) {
        //validate
        if (score[0] === score[1]) { setError("Bad score"); return; }
        var _score = score.slice(0, sets * 2);
        if (!opponent) { setError("No opponent selected"); return; }
        let response = await post('/api/ladder',
            {
                CompetitionName: competitionName,
                Opponent: opponent.id,
                Score: _score,
                DatePlayed: datePlayed,
                Partner: doubles ? partner?.id : null,
                Opponent2: doubles ? opponent2?.id : null,
            }, null);

        if (!response.ok) {
            setError("Failed to record result");
            return;
        }
        handleClose();
        updateDisplay();
        setError("");
        response = await response.json();
        if (response === "Pending")
            setMatchStatus("Result recorded/updated. Awaiting opponent confirmation.");
    };
    return (
        <>
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Record match result</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form action={action}>
                    <Form.Group className="mb-3  align-items-center " >
                        <Row gap={3}>
                            <Col>
                                <Form.Label>Select opponent</Form.Label>
                            </Col>
                            <Col>
                                <Form.Select id="opponentSelect"
                                    onChange={e => { setOpponent(players[e.target.value]) }}>
                                    <option>Select an opponent</option>
                                    {players?.map((player, i) => <option key={i} value={i}>{player.name}</option>)}
                                </Form.Select>
                            </Col>
                        </Row>
                        {doubles &&
                            <>
                                <Row gap={3} className="mt-3">
                                    <Col>
                                        <Form.Label>Select opponent 2</Form.Label>
                                    </Col>
                                    <Col>
                                        <Form.Select id="opponent2Select"
                                            onChange={e => { setOpponent2(players[e.target.value]) }}>
                                            <option>Select an opponent</option>
                                            {players?.map((player, i) => <option key={i} value={i}>{player.name}</option>)}
                                        </Form.Select>
                                    </Col>
                                </Row>
                                <Row gap={3} className="mt-3">
                                    <Col>
                                        <Form.Label>Select partner</Form.Label>
                                    </Col>
                                    <Col>
                                        <Form.Select id="partnerSelect"
                                            onChange={e => { setPartner(players[e.target.value]) }}>
                                            <option>Select a partner</option>
                                            {players?.map((player, i) => <option key={i} value={i}>{player.name}</option>)}
                                        </Form.Select>
                                    </Col>
                                </Row>
                            </>
                        }
                    </Form.Group>
                    <Form.Group className="mb-3  align-items-center ">
                        <Row>
                            <Col>
                                <Form.Label>Date played</Form.Label>
                            </Col>
                            <Col>
                                <Form.Control
                                    type="date"
                                    value={datePlayed}
                                    min={twoWeeksAgo}
                                    max={today}
                                    onChange={e => setDate(e.target.value)}
                                />
                            </Col>
                        </Row>
                    </Form.Group>
                    <Form.Group className="mb-3 align-items-center" >
                        <Row>
                            <Col>
                                <Form.Label >Sets played</Form.Label>
                            </Col>
                            <Col>
                                <Form.Select value={sets} onChange={e => setSets(Number(e.target.value))}>
                                    <option value={1}>One</option>
                                    <option value={2}>Two</option>
                                    <option value={3}>Three</option>
                                    <option value={4}>Four</option>
                                    <option value={5}>Five</option>
                                </Form.Select>
                            </Col>
                        </Row>
                        <datalist id="setValues">
                            <option value="0"></option>
                            <option value="1"></option>
                            <option value="2"></option>
                            <option value="3"></option>
                            <option value="4"></option>
                            <option value="5"></option>
                            <option value="6"></option>
                            <option value="7"></option>
                        </datalist>
                        {[...Array(sets)].map((x, i) => {
                            return <div key={'sets' + i}>
                                <Stack direction="horizontal" gap={3}>
                                    <Form.Label className="m-3" >You</Form.Label>
                                    <Form.Control type="number"
                                        onChange={e => setScore(prev => { return prev.map((v, ii) => ii === i*2 ? Number(e.target.value) : v) })}
                                        list="setValues" placeholder="0" min="0" step-="1" />
                                    -
                                    <Form.Control type="number"
                                        onChange={e => setScore(prev => prev.map((v, ii) => ii === (i*2 + 1) ? Number(e.target.value) : v))}
                                        list="setValues" placeholder="0" min="0" step-="1" />
                                    <Form.Label className="m-3" >Them{/*opponent?.name ?? 'Select Opponent'*/}</Form.Label>

                                </Stack>
                            </div>
                        })
                        }
                    </Form.Group>

                    <div style={{ color: 'red' }}>{state}{error}</div>
                </Form>
                <small><i>The opponent must also report the same score for the same day the match is played.</i></small>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="primary" type="submit"
                    disabled={isPending || !opponent || (score[0] === score[1])}
                    onClick={logMatch}>
                    Submit Match
                </Button>
            </Modal.Footer>
            </Modal>

            <p>
                <Button onClick={handleShow}>Record match result</Button>
            </p>
            <p>
                {matchStatus}
            </p>
        </>
    );
}
export default MatchReport;