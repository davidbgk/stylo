import React, { useCallback, useState, useEffect } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'

import styles from './login.module.scss'
import Field from './Field'
import Button from './Button'
import { HelpCircle } from 'react-feather'
import InlineAlert from "./feedback/InlineAlert.jsx";

export default function Login () {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const dispatch = useDispatch()
  const { replace, location } = useHistory()
  const setSessionToken = useCallback((token) => dispatch({ type: 'UPDATE_SESSION_TOKEN', token }), [])
  const authToken = new URLSearchParams(location.hash).get('#auth-token')

  const backendEndpoint = useSelector(state => state.applicationConfig.backendEndpoint)
  const humanIdRegisterEndpoint = useSelector(state => state.applicationConfig.humanIdRegisterEndpoint)

  useEffect(() => {
    if (authToken) {
      setSessionToken(authToken)
      replace(location.pathname)
    }
  }, [authToken])

  const handleSubmit = useCallback((event) => {
    setError('')
    event.preventDefault()

    fetch(backendEndpoint + '/login/local', {
      method: 'POST',
      // this parameter enables the cookie directive (set-cookie)
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => {
        return response.ok
          ? response.json()
          : Promise.reject(new Error('Email or password is incorrect'))
      })
      .then((data) => dispatch({ type: 'LOGIN', ...data }))
      .catch((error) => {
        setError(error.message)
      })
  }, [username, password])

  return (
    <>
      <section className={styles.disclaimer}>
        <p>
          Looking for technical and editing support?
          <br/>
          Join the{' '}
          <a
            href="https://ecrituresnumeriques.ca/en/2019/10/25/Stylo-technical-and-editing-support"
            target="_blank"
          >
            weekly session
          </a>{' '}
          for Stylo users.
        </p>
      </section>

      <section className={styles.box}>
        <h1 className={styles.loginTitle}>Welcome to Stylo!</h1>
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend>
              Connect with a Huma-Num account <small>(recommended)</small>
            </legend>

            <p className={styles.help}>
              <HelpCircle size={18} className={styles.inlineIcon}/>
              <a href="https://humanum.hypotheses.org/5754#content">How does it work?</a>
            </p>

            <p className={styles.authenticationProviderLinks}>
              <a
                className={styles.humaNumConnectBtn}
                href={backendEndpoint + '/login/openid'}
              >
                Connect with Huma-Num
              </a>
              <a
                className={styles.humaNumCreateAccountBtn}
                href={humanIdRegisterEndpoint}
              >
                Create a Huma-Num account
              </a>
            </p>

            <p className={styles.help}>
              <HelpCircle size={18} className={styles.inlineIcon}/>
              If you use the same email address for your{' '}
              <strong>existing</strong> Stylo account and for your Huma-Num
              account, the two accounts will be automatically merged.
            </p>
          </fieldset>

          <hr/>

          <fieldset>
            <legend>Connect with a local Stylo account</legend>

            <Field label="Username" id="username" hasError={error !== ''} required={true} autoFocus={true} autoComplete="username" onChange={event => setUsername(event.target.value)}/>
            <Field label="Password" id="password" hasError={error !== ''} required={true} type="password" autoComplete="current-password" onChange={event => setPassword(event.target.value)}/>

            {error && <InlineAlert message={error}/>}
            <ul className={styles.actions}>
              <li>
                <Link to="/register">Create an account</Link>
              </li>
              <li className={styles.actionsSubmit}>
                <Button primary={true} type="submit">Login</Button>
              </li>
            </ul>
          </fieldset>
        </form>
      </section>
    </>
  )
}
