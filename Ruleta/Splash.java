/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package Ruleta;

/**
 *
 * @author OMGM
 */
public class Splash {
    
    public static void main(String[] args)
    {
        FrmSplash Ventana = new FrmSplash();
        Ventana.setLocationRelativeTo(null);
        Ventana.setVisible(true);
        
        for (int i = 0; i <= 101; i++)
        {
            try
            {
                Thread.sleep(50);
            }
            catch (Exception err)
            {
                err.printStackTrace();
            }
            Ventana.JlContador.setText(String.valueOf(i)+"%");
            //Ventana.Progreso.setValue(i);
        }
        Ventana.dispose();
        //CARGAMOS LA FRM_INICIO
        FrmInicioP Inicio =  new FrmInicioP();
        Inicio.setLocationRelativeTo(null);
        Inicio.setVisible(true);
    }
}
