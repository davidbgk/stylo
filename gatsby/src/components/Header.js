import React from "react"
import { Link } from "gatsby"
import { connect } from "react-redux"

import styles from './header.module.scss'

const mapStateToProps = ({ logedIn }) => {
    return { logedIn }
}

const mapDispatchToProps = dispatch => {
    return { 
        login: () => dispatch({ type: `LOGIN` }),
        logout: () => dispatch({ type: `LOGOUT` })
    }
}



const ConnectedHeader = (props) => {
    return (
        <header className={`${styles.header} ${props.className}`}>
            <Link to="/centered">Centered</Link>
            <Link to="/wrapped">Wrapped</Link>
            <Link to="/fullPage">fullPage</Link>
            Headerino
            {props.logedIn && <p onClick={()=>props.logout()}>Log out</p>}
            {!props.logedIn && <p onClick={()=>props.login()}>Log in</p>}
        </header> 
    )
}

const Header = connect(
    mapStateToProps,
    mapDispatchToProps
)(ConnectedHeader)
export default Header