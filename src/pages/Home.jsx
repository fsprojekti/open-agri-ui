import logo from '../assets/Logo.png';

export default function Home() {
    return <div className="container mt-5">
        <img
            src={logo}
            alt="Description of image"
            className="img-fluid mt-3"
            // style={{ maxWidth: '500px' }}
        />
    </div>;
}
